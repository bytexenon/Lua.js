/**
 * Instructions for modifying node classes:
 *
 * 1. Update Node Class:
 *    - Add, rename, or remove the node class in this file.
 *
 * 2. Update Node Schema:
 *    - Reflect the changes in the node schema by updating `node-schema.ts`.
 *
 * 3. Update Node Enum:
 *    - Ensure the node type entries in node enum are consistent with the changes in this file.
 */

/* Imports */
import { ASTNode, ASTNodeList } from "./base.js";
export { ASTNode, ASTNodeList };

/* Node Type Enum */
export const enum NodeType {
  // Basic nodes //
  AST_NODE = "AST_NODE",
  AST_NODE_LIST = "AST_NODE_LIST",

  // List nodes //
  PROGRAM = "PROGRAM",
  CHUNK = "CHUNK",
  EXPRESSION_LIST = "EXPRESSION_LIST",
  IF_BRANCH_LIST = "IF_BRANCH_LIST",

  // Variable node //
  VARIABLE = "VARIABLE",

  // Primitive nodes //
  NUMBER_LITERAL = "NUMBER_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  VALUE_LITERAL = "VALUE_LITERAL",
  VARARG_LITERAL = "VARARG_LITERAL",

  // Expression nodes //
  BINARY_OPERATOR = "BINARY_OPERATOR",
  UNARY_OPERATOR = "UNARY_OPERATOR",
  FUNCTION_CALL = "FUNCTION_CALL",
  TABLE_INDEX = "TABLE_INDEX",
  ANONYMOUS_FUNCTION = "ANONYMOUS_FUNCTION",
  TABLE_ELEMENT = "TABLE_ELEMENT",
  TABLE_CONSTRUCTOR = "TABLE_CONSTRUCTOR",

  // Statement nodes //
  LOCAL_ASSIGNMENT = "LOCAL_ASSIGNMENT",
  VARIABLE_ASSIGNMENT = "VARIABLE_ASSIGNMENT",
  FUNCTION_DECLARATION = "FUNCTION_DECLARATION",
  LOCAL_FUNCTION_DECLARATION = "LOCAL_FUNCTION_DECLARATION",
  RETURN_STATEMENT = "RETURN_STATEMENT",
  BREAK_STATEMENT = "BREAK_STATEMENT",
  DO_STATEMENT = "DO_STATEMENT",
  WHILE_STATEMENT = "WHILE_STATEMENT",
  REPEAT_UNTIL_STATEMENT = "REPEAT_UNTIL_STATEMENT",
  NUMERIC_FOR_STATEMENT = "NUMERIC_FOR_STATEMENT",
  GENERIC_FOR_STATEMENT = "GENERIC_FOR_STATEMENT",
  IF_BRANCH = "IF_BRANCH",
  IF_STATEMENT = "IF_STATEMENT",
}
export const enum VariableType {
  LOCAL = "LOCAL",
  GLOBAL = "GLOBAL",
  UPVALUE = "UPVALUE",
}

/* List nodes */
export class Program extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.PROGRAM, children);
  }
}
export class Chunk extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.CHUNK, children);
  }
}
export class ExpressionList extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.EXPRESSION_LIST, children);
  }
}
export class IfBranchList extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.IF_BRANCH_LIST, children);
  }
}

/* Variable nodes */
export class VariableNode extends ASTNode {
  constructor(
    public name: string,
    public variableType: VariableType,
  ) {
    super(NodeType.VARIABLE);
  }
}
export class LocalVariable extends VariableNode {
  constructor(name: string) {
    super(name, VariableType.LOCAL);
  }
}
export class GlobalVariable extends VariableNode {
  constructor(name: string) {
    super(name, VariableType.GLOBAL);
  }
}
export class UpvalueVariable extends VariableNode {
  constructor(name: string) {
    super(name, VariableType.UPVALUE);
  }
}

/* Primitive nodes */
export class NumberLiteral extends ASTNode {
  constructor(public value: string) {
    super(NodeType.NUMBER_LITERAL);
  }
}
export class StringLiteral extends ASTNode {
  constructor(public value: string) {
    super(NodeType.STRING_LITERAL);
  }
}
export class ValueLiteral extends ASTNode {
  constructor(public value: string) {
    super(NodeType.VALUE_LITERAL);
  }
}
export class VarargLiteral extends ASTNode {
  constructor() {
    super(NodeType.VARARG_LITERAL);
  }
}

/* Expression nodes */
export class BinaryOperator extends ASTNode {
  constructor(
    public operator: string,
    public left: ASTNode,
    public right: ASTNode,
  ) {
    super(NodeType.BINARY_OPERATOR);
  }
}
export class UnaryOperator extends ASTNode {
  constructor(
    public operator: string,
    public operand: ASTNode,
  ) {
    super(NodeType.UNARY_OPERATOR);
  }
}
export class FunctionCall extends ASTNode {
  constructor(
    public expression: ASTNode,
    public argumentsList: ASTNodeList,
    public isMethodCall = false,
  ) {
    super(NodeType.FUNCTION_CALL);
  }
}
export class TableIndex extends ASTNode {
  constructor(
    public expression: ASTNode,
    public index: ASTNode,
  ) {
    super(NodeType.TABLE_INDEX);
  }
}
export class AnonymousFunction extends ASTNode {
  constructor(
    public parameters: string[],
    public chunk: Chunk,
  ) {
    super(NodeType.ANONYMOUS_FUNCTION);
  }
}
export class TableElement extends ASTNode {
  constructor(
    public key: ASTNode,
    public value: ASTNode,
    public isImplicitKey = false,
  ) {
    super(NodeType.TABLE_ELEMENT);
  }
}
export class TableConstructor extends ASTNode {
  constructor(public elements: ASTNodeList) {
    super(NodeType.TABLE_CONSTRUCTOR);
  }
}

/* Statement nodes */
export class LocalAssignment extends ASTNode {
  constructor(
    public locals: string[],
    public expressions: ExpressionList | undefined,
  ) {
    super(NodeType.LOCAL_ASSIGNMENT);
  }
}
export class VariableAssignment extends ASTNode {
  constructor(
    public lvalues: ASTNode[],
    public expressions: ASTNodeList,
  ) {
    super(NodeType.VARIABLE_ASSIGNMENT);
  }
}
export class FunctionDeclaration extends ASTNode {
  constructor(
    public variable: VariableNode,
    public fields: string[],
    public parameters: string[],
    public chunk: Chunk,
    public isMethod = false,
  ) {
    super(NodeType.FUNCTION_DECLARATION);
  }
}
export class LocalFunctionDeclaration extends ASTNode {
  constructor(
    public name: string,
    public parameters: string[],
    public chunk: Chunk,
  ) {
    super(NodeType.LOCAL_FUNCTION_DECLARATION);
  }
}
export class ReturnStatement extends ASTNode {
  constructor(public expressions: ExpressionList) {
    super(NodeType.RETURN_STATEMENT);
  }
}
export class BreakStatement extends ASTNode {
  constructor() {
    super(NodeType.BREAK_STATEMENT);
  }
}
export class DoStatement extends ASTNode {
  constructor(public chunk: Chunk) {
    super(NodeType.DO_STATEMENT);
  }
}
export class WhileStatement extends ASTNode {
  constructor(
    public condition: ASTNode,
    public chunk: Chunk,
  ) {
    super(NodeType.WHILE_STATEMENT);
  }
}
export class RepeatUntilStatement extends ASTNode {
  constructor(
    public chunk: Chunk,
    public condition: ASTNode,
  ) {
    super(NodeType.REPEAT_UNTIL_STATEMENT);
  }
}
export class NumericForStatement extends ASTNode {
  constructor(
    public variable: string,
    public start: ASTNode,
    public end: ASTNode,
    public step: ASTNode | null,
    public chunk: Chunk,
  ) {
    super(NodeType.NUMERIC_FOR_STATEMENT);
  }
}
export class GenericForStatement extends ASTNode {
  constructor(
    public variables: string[],
    public generator: ASTNode,
    public state: ASTNode | undefined,
    public control: ASTNode | undefined,
    public chunk: Chunk,
  ) {
    super(NodeType.GENERIC_FOR_STATEMENT);
  }
}
export class IfBranch extends ASTNode {
  constructor(
    public condition: ASTNode | null,
    public chunk: Chunk,
  ) {
    super(NodeType.IF_BRANCH);
  }
}
export class IfStatement extends ASTNode {
  constructor(public branches: IfBranchList) {
    super(NodeType.IF_STATEMENT);
  }
}
