/* Dependencies */
import {
  IRInstruction,
  IROperand,
  IROperandType,
  Opcodes,
} from "./instructions/index.js";
import {
  LuaConstant,
  LuaConstantType,
  LuaConstantValue,
  LuaPrototype,
  LuaScope,
} from "./lua/index.js";
import * as ASTNode from "../parser/ast-node/ast-node.js";

/* Constants */

// prettier-ignore
const ARITHMETIC_OPERATOR_MAP: Record<string, Opcodes> = {
  "+": Opcodes.ADD, "-": Opcodes.SUB,
  "*": Opcodes.MUL, "/": Opcodes.DIV,
  "%": Opcodes.MOD, "^": Opcodes.POW,
};

// prettier-ignore
const COMPARISON_OPERATOR_MAP: Record<string, [Opcodes, boolean]> = {
  "~=": [Opcodes.EQ, true],  "==": [Opcodes.EQ, false],
  "<":  [Opcodes.LT, false], ">":  [Opcodes.LT, true],
  "<=": [Opcodes.LE, false], ">=": [Opcodes.LE, true],
};

const CONTROL_FLOW_OPERATORS: Set<string> = new Set(["and", "or"]);

/*
Lua register stack:
+----------------------+
|      Variables       |
|----------------------|
| Local Variable 1     |
| Local Variable 2     |
| ...                  |
| Local Variable N     |
+----------------------+
| Temporary Registers  |
|----------------------|
| Temp Register 1      |
| Temp Register 2      |
| ...                  |
| Temp Register M      |
+----------------------+

(Max stack size = 256, where N + M <= 256 and N <= 200)

Local variables are stored in the lower part of the stack,
and temporary registers are used for intermediate values,
such as operands in arithmetic operations, function call arguments,
return values, etc.
*/

/* Compiler */
export class Compiler {
  public currentProto: LuaPrototype;
  private currentChunk: ASTNode.Chunk | ASTNode.Program;
  private currentRegister: number; // current (free) register
  private numVars: number; // number of active variables
  private scopeStack: LuaScope[];
  private currentScope: LuaScope | undefined;

  /* Constructor */
  constructor(ast: ASTNode.Program) {
    this.currentProto = new LuaPrototype();
    this.currentChunk = ast;
    this.currentRegister = -1;
    this.numVars = 0;
    this.scopeStack = [];
    this.currentScope = undefined;
  }

  /* Stack Management */
  private allocateRegister(): number {
    this.currentRegister += 1;

    // Update max stack size if needed
    if (this.currentProto.maxStackSize < this.currentRegister) {
      this.currentProto.maxStackSize = this.currentRegister;
    }

    return this.currentRegister;
  }
  private freeRegister(): void {
    this.currentRegister -= 1;
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
    const scope = new LuaScope(isFunctionScope);
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
  private findConstantIndex(
    constantType: LuaConstantType,
    constantValue: LuaConstantValue,
  ): number {
    for (const [index, constant] of this.currentProto.constants.entries()) {
      if (constant.type === constantType && constant.value === constantValue) {
        return index;
      }
    }

    return -1;
  }
  private emit(
    opcode: Opcodes,
    operands: IROperand[],
  ): [IRInstruction, number] {
    const instruction = new IRInstruction(opcode, operands);
    this.currentProto.code.push(instruction);
    return [instruction, this.currentProto.code.length - 1];
  }
  private static changeInstruction(
    instruction: IRInstruction,
    opcode?: Opcodes,
    operands?: IROperand[],
  ): void {
    instruction.opcode = opcode ?? instruction.opcode;
    instruction.operands = operands ?? instruction.operands;
  }
  private emitConstant(
    constantType: LuaConstantType,
    constantValue: LuaConstantValue,
  ): number {
    // Check if the constant already exists
    const existingIndex = this.findConstantIndex(constantType, constantValue);
    if (existingIndex !== -1) {
      return existingIndex;
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
    let constantValue = node.value;
    let constantType: LuaConstantType;

    switch (nodeType) {
      case ASTNode.NodeType.NUMBER_LITERAL: {
        constantType = LuaConstantType.LUA_TNUMBER;
        break;
      }
      case ASTNode.NodeType.STRING_LITERAL: {
        constantType = LuaConstantType.LUA_TSTRING;
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
  private compileBinaryOperatorNode(
    node: ASTNode.BinaryOperator,
    targetRegister: number,
  ) {
    const operator = node.operator;

    // Handle control flow operators (and, or)
    if (CONTROL_FLOW_OPERATORS.has(operator)) {
      const leftRegister = this.compileExpressionNode(node.left);
      const shouldShortCircuit = operator === "or" ? 1 : 0;

      // Emit TEST instruction
      this.emit(Opcodes.TEST, [
        new IROperand(IROperandType.REGISTER, leftRegister),
        new IROperand(IROperandType.OTHER, 0),
        new IROperand(IROperandType.OTHER, shouldShortCircuit),
      ]);

      // Emit placeholder JMP instruction
      const [jumpInstruction, jumpIndex] = this.emit(Opcodes.JMP, []);

      // Generate a LOADBOOL instruction pair
      this.emit(Opcodes.LOADBOOL, [
        new IROperand(IROperandType.REGISTER, targetRegister),
        new IROperand(IROperandType.OTHER, 0),
        new IROperand(IROperandType.OTHER, 1),
      ]);
      this.emit(Opcodes.LOADBOOL, [
        new IROperand(IROperandType.REGISTER, targetRegister),
        new IROperand(IROperandType.OTHER, 1),
        new IROperand(IROperandType.OTHER, 0),
      ]);

      // Compile right expression
      this.compileExpressionNode(node.right, targetRegister);

      // Update JMP instruction with correct offset
      Compiler.changeInstruction(jumpInstruction, Opcodes.JMP, [
        new IROperand(
          IROperandType.OTHER,
          this.currentProto.code.length - jumpIndex,
        ),
      ]);
      return;
    }

    const leftRegister = this.compileExpressionNode(node.left);
    const rightRegister = this.compileExpressionNode(node.right);

    // Handle arithmetic operators (+, -, *, /, %, ^)
    if (ARITHMETIC_OPERATOR_MAP[operator]) {
      const opcode = ARITHMETIC_OPERATOR_MAP[operator];

      // Emit arithmetic instruction
      this.emit(opcode, [
        new IROperand(IROperandType.REGISTER, targetRegister),
        new IROperand(IROperandType.REGISTER, leftRegister),
        new IROperand(IROperandType.REGISTER, rightRegister),
      ]);
    }
    // Handle comparison operators (==, ~=, <, >, <=, >=)
    else if (COMPARISON_OPERATOR_MAP[operator]) {
      const [opcode, invert] = COMPARISON_OPERATOR_MAP[operator];

      // Emit comparison instruction
      this.emit(opcode, [
        new IROperand(IROperandType.OTHER, invert ? 1 : 0),
        new IROperand(
          IROperandType.REGISTER,
          invert ? rightRegister : leftRegister,
        ),
        new IROperand(
          IROperandType.REGISTER,
          invert ? leftRegister : rightRegister,
        ),
      ]);

      // Emit LOADBOOL instructions for boolean result
      this.emit(Opcodes.LOADBOOL, [
        new IROperand(IROperandType.REGISTER, targetRegister),
        new IROperand(IROperandType.OTHER, 0),
        new IROperand(IROperandType.OTHER, 1),
      ]);
      this.emit(Opcodes.LOADBOOL, [
        new IROperand(IROperandType.REGISTER, targetRegister),
        new IROperand(IROperandType.OTHER, 1),
        new IROperand(IROperandType.OTHER, 0),
      ]);
    }
    // Handle concatenation operator (..)
    else if (operator === "..") {
      // Ensure concatenation operands are in consecutive registers
      if (leftRegister + 1 !== rightRegister) {
        throw new Error(
          "Concatenation operands must be consecutive registers." +
            " You shouldn't see this error.",
        );
      }

      // Emit CONCAT instruction
      this.emit(Opcodes.CONCAT, [
        new IROperand(IROperandType.REGISTER, targetRegister),
        new IROperand(IROperandType.REGISTER, leftRegister),
        new IROperand(IROperandType.REGISTER, rightRegister),
      ]);
    }

    // Free registers used for left and right expressions
    this.freeRegister(); // Free right expression register
    this.freeRegister(); // Free left expression register
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
  private compileWhileStatement(node: ASTNode.WhileStatement): void {
    // Destructure condition and chunk from the node
    const { condition, chunk } = node;
    const startOfLoop = this.currentProto.code.length;

    // Compile the condition expression and get the register
    const conditionRegister = this.compileExpressionNode(condition);

    // Emit a TEST instruction to evaluate the condition
    this.emit(Opcodes.TEST, [
      new IROperand(IROperandType.REGISTER, conditionRegister),
      new IROperand(IROperandType.OTHER, 0),
      new IROperand(IROperandType.OTHER, 1),
    ]);

    // Emit a JMP instruction and store the jump instruction and index
    const [jumpInstruction, jumpIndex] = this.emit(Opcodes.JMP, []);
    this.compileChunk(chunk);

    // Change the JMP instruction to jump back to the start of the loop
    this.emit(Opcodes.JMP, [
      new IROperand(
        IROperandType.OTHER,
        startOfLoop - this.currentProto.code.length - 1,
      ),
    ]);

    // Update the TEST instruction with the correct offset
    Compiler.changeInstruction(jumpInstruction, Opcodes.JMP, [
      new IROperand(
        IROperandType.OTHER,
        this.currentProto.code.length - jumpIndex,
      ),
    ]);
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
      case ASTNode.NodeType.BINARY_OPERATOR: {
        this.compileBinaryOperatorNode(
          node as ASTNode.BinaryOperator,
          targetRegister,
        );
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
      case ASTNode.NodeType.WHILE_STATEMENT: {
        this.compileWhileStatement(node as ASTNode.WhileStatement);
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
