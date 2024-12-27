/* Dependencies */
import * as ASTNode from "../parser/ast-node/ast-node.js";
import {
  IRInstruction,
  Opcodes,
  IROperand,
  IROperandType,
} from "./instructions/index.js";
import {
  LuaConstant,
  LuaConstantType,
  LuaConstantValue,
  LuaPrototype,
  Scope,
} from "./lua/index.js";

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
  public currentProto: LuaPrototype;
  private currentChunk: ASTNode.Chunk | ASTNode.Program;
  private nextRegister: number; // next free register
  private numVars: number; // number of active variables
  private scopeStack: Scope[];
  private currentScope: Scope | undefined;

  /* Constructor */
  constructor(ast: ASTNode.Program) {
    this.currentProto = new LuaPrototype();
    this.currentChunk = ast;
    this.nextRegister = -1;
    this.numVars = 0;
    this.scopeStack = [];
    this.currentScope = undefined;
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
  private registerVariables(names: string[]): void {
    for (const name of names) {
      this.registerVariable(name);
    }
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
  private unregisterVariables(names: string[]): void {
    for (const name of names) {
      this.unregisterVariable(name);
    }
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
    this.unregisterVariables(Object.keys(this.currentScope.locals));

    this.scopeStack.pop();
    this.currentScope = this.scopeStack.at(-1) ?? undefined;
  }

  // Runs at the end of compilation to ensure that
  // all pushed scopes have been popped
  private checkScopeStack(): void {
    if (this.scopeStack.length > 0) {
      throw new Error("Scope stack not empty");
    }
  }

  /* Prototype Management */
  private emit(opcode: Opcodes, operands: IROperand[]): void {
    this.currentProto.code.push(new IRInstruction(opcode, operands));
  }
  private emitConstant(
    constantType: LuaConstantType,
    constantValue: LuaConstantValue,
  ): number {
    // Check if the constant already exists
    for (const [
      index,
      existingConstant,
    ] of this.currentProto.constants.entries()) {
      if (
        existingConstant.type === constantType &&
        existingConstant.value === constantValue
      ) {
        return index;
      }
    }

    const index = this.currentProto.constants.length;
    this.currentProto.constants.push(
      new LuaConstant(constantType, constantValue),
    );
    return index;
  }

  /* Compilation Helpers */
  private compileConstantNode(
    node: ASTNode.NumberLiteral | ASTNode.StringLiteral,
    targetRegister: number,
  ): void {
    const nodeType = node.type;
    let constantType: LuaConstantType;
    let constantValue: number | string | boolean;

    switch (nodeType) {
      case ASTNode.NodeType.NUMBER_LITERAL: {
        constantType = LuaConstantType.LUA_TNUMBER;
        constantValue = node.value;
        break;
      }
      case ASTNode.NodeType.STRING_LITERAL: {
        constantType = LuaConstantType.LUA_TSTRING;
        constantValue = node.value;
        break;
      }
      default: {
        throw new Error(`Unsupported constant node type: ${nodeType}`);
      }
    }

    const constantIndex = this.emitConstant(constantType, constantValue);
    this.emit(Opcodes.LOADK, [
      new IROperand(IROperandType.REGISTER, targetRegister),
      new IROperand(IROperandType.CONSTANT, constantIndex),
    ]);
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
  private compileVariableNode(
    node: ASTNode.VariableNode,
    targetRegister: number,
  ): void {
    const variableName = node.name;

    let currentScope = this.currentScope;
    while (currentScope) {
      if (currentScope.locals[variableName] !== undefined) {
        const variableRegister = currentScope.locals[variableName];
        this.emit(Opcodes.MOVE, [
          new IROperand(IROperandType.REGISTER, targetRegister),
          new IROperand(IROperandType.REGISTER, variableRegister),
        ]);
        return;
      }

      currentScope = this.scopeStack[this.scopeStack.indexOf(currentScope) - 1];
    }

    // Variable not found in any scope, assume global
    const constantIndex = this.emitConstant(
      LuaConstantType.LUA_TSTRING,
      variableName,
    );

    this.emit(Opcodes.GETGLOBAL, [
      new IROperand(IROperandType.REGISTER, targetRegister),
      new IROperand(IROperandType.CONSTANT, constantIndex),
    ]);
  }

  /* Statement Compilation */
  private compileDoStatement(node: ASTNode.DoStatement): void {
    this.compileChunk(node.chunk);
  }
  private compileLocalAssignment(node: ASTNode.LocalAssignment): void {
    const locals = node.locals;
    const expressions = node.expressions;

    if (expressions) {
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
    } else {
      this.registerVariables(locals);
    }
  }

  /* Node Compilation Handlers */
  public compileExpressionNode(
    node: ASTNode.ASTNode,
    targetRegister: number = this.allocateRegister(),
  ): number {
    switch (node.type) {
      case ASTNode.NodeType.NUMBER_LITERAL: {
        this.compileNumberLiteral(
          node as ASTNode.NumberLiteral,
          targetRegister,
        );
        break;
      }
      case ASTNode.NodeType.STRING_LITERAL: {
        this.compileStringLiteral(
          node as ASTNode.StringLiteral,
          targetRegister,
        );
        break;
      }
      case ASTNode.NodeType.VARIABLE: {
        this.compileVariableNode(node as ASTNode.VariableNode, targetRegister);
        break;
      }
      default: {
        throw new Error(`Unsupported expression node type: ${node.type}`);
      }
    }

    return targetRegister;
  }
  public compileStatementNode(node: ASTNode.ASTNode): void {
    switch (node.type) {
      case ASTNode.NodeType.DO_STATEMENT: {
        this.compileDoStatement(node as ASTNode.DoStatement);
        break;
      }
      case ASTNode.NodeType.LOCAL_ASSIGNMENT: {
        this.compileLocalAssignment(node as ASTNode.LocalAssignment);
        break;
      }
      default: {
        throw new Error(`Unsupported statement node type: ${node.type}`);
      }
    }
  }

  /* Chunk Compilation */
  private compileChunk(
    node: ASTNode.Chunk,
    isFunctionScope = false,
    variables: string[] = [],
  ): void {
    this.pushScope(isFunctionScope);
    this.registerVariables(variables);
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
