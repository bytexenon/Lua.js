/* Dependencies */
import * as ASTNode from "../parser/ast-node/ast-node.js";

/* Opcodes */
// prettier-ignore
const enum Opcodes {
  MOVE,      LOADK,    LOADBOOL,  LOADNIL,  GETUPVAL,
  GETGLOBAL, GETTABLE, SETGLOBAL, SETUPVAL, SETTABLE,
  NEWTABLE,  SELF,     ADD,       SUB,      MUL,
  DIV,       MOD,      POW,       UNM,      NOT,
  LEN,       CONCAT,   JMP,       EQ,       LT,
  LE,        TEST,     TESTSET,   CALL,     TAILCALL,
  RETURN,    FORLOOP,  FORPREP,   TFORLOOP, SETLIST,
  CLOSE,     CLOSURE,  VARARG
}

/* IRInstruction */
class IRInstruction {
  /* Example:
  MOVE R0, R1 ; Two registers
  LOADK R0, K0 ; Register and constant
  ADD R0, K0, K1 ; Register (dest) and two constants
  CLOSURE R0, P0 ; Register and prototype
  JMP OFFSET-10 ; Jump with offset (relative)
  */
  public opcode: Opcodes;
  public operands: IROperand[];

  constructor(opcode: Opcodes, operands: IROperand[]) {
    this.opcode = opcode;
    this.operands = operands;
  }
}

/* IROperand */
class IROperand {
  public type: string;
  public value: number;

  constructor(type: string, value: number) {
    this.type = type;
    this.value = value;
  }
}

/* LuaConstantType */
const enum LuaConstantType {
  LUA_TNIL = 0,
  LUA_TBOOLEAN = 1,
  LUA_TNUMBER = 3,
  LUA_TSTRING = 4,
}

/* LuaConstant */
class LuaConstant {
  public type: LuaConstantType;
  public value: number | string | boolean;

  constructor(type: LuaConstantType, value: number | string | boolean) {
    this.type = type;
    this.value = value;
  }
}

/* LuaPrototype */
export class LuaPrototype {
  public code: IRInstruction[];
  public constants: LuaConstant[];
  public prototypes: LuaPrototype[];
  public numParams: number;
  public isVararg: boolean;
  public maxStackSize: number;

  constructor(
    code: IRInstruction[] = [],
    constants: LuaConstant[] = [],
    prototypes: LuaPrototype[] = [],
    numParams = 0,
    isVararg = false,
    // registers 0/1 are always valid
    maxStackSize = 2,
  ) {
    this.code = code;
    this.constants = constants;
    this.prototypes = prototypes;
    this.numParams = numParams;
    this.isVararg = isVararg;
    this.maxStackSize = maxStackSize;
  }
}

/* Scope */
export class Scope {
  public readonly isFunctionScope: boolean;
  public locals: Record<string, number>; // variable name to register mapping

  constructor(isFunctionScope = false) {
    this.isFunctionScope = isFunctionScope;
    this.locals = {};
  }
}

/*
Lua register stack:
+----------------------+
|      Variables       |
|----------------------|
| Variable 1           |
| Variable 2           |
| ...                  |
| Variable 200         |
+----------------------+
| Temporary Registers  |
|----------------------|
| Temp Register 1      |
| Temp Register 2      |
| ...                  |
| Temp Register 56     |
+----------------------+

(Max stack size = 256, temp. register count = 256 - 200 = 56) 

Variables always should be on top of the stack,
a variable can't come after a temporary register.

Temporary registers are used for intermediate values,
such as operands in arithmetic operations, function call arguments,
return values, etc -- anything that doesn't have a variable assigned to it.
*/

/* Compiler */
export class Compiler {
  private currentProto: LuaPrototype;
  private currentChunk: ASTNode.Chunk | ASTNode.Program;
  private nextRegister: number; // next free register
  private numVars: number; // number of active variables
  private scopeStack: Scope[];
  private currentScope: Scope | null;

  /* Constructor */
  constructor(ast: ASTNode.Program) {
    this.currentProto = new LuaPrototype([]);
    this.currentChunk = ast;
    this.nextRegister = -1;
    this.numVars = 0;
    this.scopeStack = [];
    this.currentScope = null;
  }

  /* Stack Management */
  private allocateRegister(): number {
    this.nextRegister += 1;

    // Update max stack size if needed
    if (this.currentProto.maxStackSize < this.nextRegister) {
      this.currentProto.maxStackSize = this.nextRegister;
    }

    return this.nextRegister;
  }
  private freeRegister(): void {
    this.nextRegister -= 1;
  }

  /* Variable Management */
  private registerVariable(name: string): number {
    if (!this.currentScope) {
      throw new Error("No scope to register variable in");
    } else if (this.currentScope.locals[name] !== undefined) {
      throw new Error(`Variable '${name}' already declared in this scope`);
    }

    const variableRegister = this.allocateRegister();
    this.numVars += 1;
    this.currentScope.locals[name] = variableRegister;
    return variableRegister;
  }
  private unregisterVariable(name: string): void {
    if (!this.currentScope) {
      throw new Error("No scope to unregister variable in");
    } else if (this.currentScope.locals[name] === undefined) {
      throw new Error(`Variable '${name}' not declared in this scope`);
    } else if (this.numVars === 0) {
      throw new Error("No variables to unregister");
    }

    this.numVars -= 1;
    this.currentScope.locals[name] = -1;
    this.freeRegister();
  }

  /* Scope Management */
  private pushScope(isFunctionScope = false): void {
    const scope = new Scope(isFunctionScope);
    this.scopeStack.push(scope);
    this.currentScope = scope;
  }
  private popScope(): void {
    if (!this.currentScope) {
      throw new Error("No scope to pop");
    }

    // Unregister all local variables in the current scope
    for (const variable in this.currentScope.locals) {
      this.unregisterVariable(variable);
    }

    this.scopeStack.pop();
    this.currentScope = this.scopeStack[this.scopeStack.length - 1] ?? null;
  }

  // Runs at the end of compilation to ensure that
  // all pushed scopes have been popped
  private checkScopeStack(): void {
    if (this.scopeStack.length !== 0) {
      throw new Error("Scope stack not empty");
    }
  }

  /* Prototype Management */
  private emit(instruction: IRInstruction): void {
    this.currentProto.code.push(instruction);
  }
  private emitConstant(constant: LuaConstant): number {
    // Check if the constant already exists
    for (const [
      index,
      existingConstant,
    ] of this.currentProto.constants.entries()) {
      if (
        existingConstant.type === constant.type &&
        existingConstant.value === constant.value
      ) {
        return index;
      }
    }

    const index = this.currentProto.constants.length;
    this.currentProto.constants.push(constant);
    return index;
  }

  /* Compilation Helpers */
  private compileConstantNode(
    node: ASTNode.NumberLiteral | ASTNode.StringLiteral,
    targetRegister: number,
  ): void {
    const nodeType = node.type;
    let constantType;
    let constantValue: number | string | boolean;

    switch (nodeType) {
      case ASTNode.NodeType.NUMBER_LITERAL:
        constantType = LuaConstantType.LUA_TNUMBER;
        constantValue = node.value;
        break;
      case ASTNode.NodeType.STRING_LITERAL:
        constantType = LuaConstantType.LUA_TSTRING;
        constantValue = node.value;
        break;
      default:
        throw new Error(`Unsupported constant node type: ${nodeType}`);
    }

    const constantIndex = this.emitConstant(
      new LuaConstant(constantType, constantValue),
    );
    this.emit(
      new IRInstruction(Opcodes.LOADK, [
        new IROperand("Register", targetRegister),
        new IROperand("Constant", constantIndex),
      ]),
    );
  }

  /* Expression Compilation */
  private compileNumberLiteral(
    node: ASTNode.NumberLiteral,
    targetRegister: number,
  ): void {
    this.compileConstantNode(node, targetRegister);
  }
  private compileStringLiteral(
    node: ASTNode.StringLiteral,
    targetRegister: number,
  ): void {
    this.compileConstantNode(node, targetRegister);
  }

  /* Statement Compilation */
  private compileDoStatement(node: ASTNode.DoStatement): void {
    this.compileChunk(node.chunk);
  }
  private compileLocalAssignment(node: ASTNode.LocalAssignment): void {
    const locals = node.locals;
    const expressions = node.expressions;

    if (!expressions) {
      for (const localName of locals) {
        this.registerVariable(localName);
      }
    } else {
      for (const [index, expressionNode] of expressions.children.entries()) {
        const expressionLocal = locals[index];
        const targetRegister = expressionLocal
          ? this.registerVariable(expressionLocal)
          : this.allocateRegister();

        this.compileExpressionNode(expressionNode, targetRegister);

        if (!expressionLocal) {
          this.freeRegister(); // Free temporary register
        }
      }
    }
  }

  /* Node Compilation Handlers */
  private compileExpressionNode(
    node: ASTNode.ASTNode,
    targetRegister: number,
  ): number {
    switch (node.type) {
      case ASTNode.NodeType.NUMBER_LITERAL:
        this.compileNumberLiteral(
          node as ASTNode.NumberLiteral,
          targetRegister,
        );
        break;
      case ASTNode.NodeType.STRING_LITERAL:
        this.compileStringLiteral(
          node as ASTNode.StringLiteral,
          targetRegister,
        );
        break;
      default:
        throw new Error(`Unsupported expression node type: ${node.type}`);
    }

    return targetRegister;
  }
  private compileStatementNode(node: ASTNode.ASTNode): void {
    switch (node.type) {
      case ASTNode.NodeType.DO_STATEMENT:
        this.compileDoStatement(node as ASTNode.DoStatement);
        break;
      case ASTNode.NodeType.LOCAL_ASSIGNMENT:
        this.compileLocalAssignment(node as ASTNode.LocalAssignment);
        break;
      default:
        throw new Error(`Unsupported statement node type: ${node.type}`);
    }
  }

  /* Chunk Compilation */
  private compileChunk(
    node: ASTNode.Chunk,
    isFunctionScope = false,
    variables: string[] = [],
  ): void {
    this.pushScope(isFunctionScope);
    for (const variable of variables) {
      this.registerVariable(variable);
    }
    for (const statement of node.children) {
      this.compileStatementNode(statement);
    }
    this.popScope();
  }

  /* Compilation */
  public compile(): LuaPrototype {
    this.compileChunk(this.currentChunk, true);
    this.checkScopeStack();

    return this.currentProto;
  }
}
