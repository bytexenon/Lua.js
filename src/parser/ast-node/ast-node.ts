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
  public name: string;
  public variableType: VariableType;

  constructor(name: string, variableType: VariableType) {
    super(NodeType.VARIABLE);

    this.name = name;
    this.variableType = variableType;
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
  public value: string;

  constructor(value: string) {
    super(NodeType.NUMBER_LITERAL);

    this.value = value;
  }
}
export class StringLiteral extends ASTNode {
  public value: string;

  constructor(value: string) {
    super(NodeType.STRING_LITERAL);

    this.value = value;
  }
}
export class ValueLiteral extends ASTNode {
  public value: string;

  constructor(value: string) {
    super(NodeType.VALUE_LITERAL);

    this.value = value;
  }
}
export class VarargLiteral extends ASTNode {
  constructor() {
    super(NodeType.VARARG_LITERAL);
  }
}

/* Expression nodes */
export class BinaryOperator extends ASTNode {
  public operator: string;
  public left: ASTNode;
  public right: ASTNode;

  constructor(operator: string, left: ASTNode, right: ASTNode) {
    super(NodeType.BINARY_OPERATOR);

    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}
export class UnaryOperator extends ASTNode {
  public operator: string;
  public operand: ASTNode;

  constructor(operator: string, operand: ASTNode) {
    super(NodeType.UNARY_OPERATOR);

    this.operator = operator;
    this.operand = operand;
  }
}
export class FunctionCall extends ASTNode {
  public expression: ASTNode;
  public arguments: ASTNodeList;
  public isMethodCall: boolean;

  constructor(
    expression: ASTNode,
    argumentsList: ASTNodeList,
    isMethodCall = false,
  ) {
    super(NodeType.FUNCTION_CALL);

    this.expression = expression;
    this.arguments = argumentsList;
    this.isMethodCall = isMethodCall;
  }
}
export class TableIndex extends ASTNode {
  public expression: ASTNode;
  public index: ASTNode;

  constructor(expression: ASTNode, index: ASTNode) {
    super(NodeType.TABLE_INDEX);

    this.expression = expression;
    this.index = index;
  }
}
export class AnonymousFunction extends ASTNode {
  public parameters: string[];
  public chunk: Chunk;

  constructor(parameters: string[], chunk: Chunk) {
    super(NodeType.ANONYMOUS_FUNCTION);

    this.parameters = parameters;
    this.chunk = chunk;
  }
}
export class TableElement extends ASTNode {
  public key: ASTNode;
  public value: ASTNode;
  public isImplicitKey: boolean;

  constructor(key: ASTNode, value: ASTNode, isImplicitKey = false) {
    super(NodeType.TABLE_ELEMENT);

    this.key = key;
    this.value = value;
    this.isImplicitKey = isImplicitKey;
  }
}
export class TableConstructor extends ASTNode {
  public elements: ASTNodeList;

  constructor(elements: ASTNodeList) {
    super(NodeType.TABLE_CONSTRUCTOR);

    this.elements = elements;
  }
}

/* Statement nodes */
export class LocalAssignment extends ASTNode {
  public locals: string[];
  public expressions: ExpressionList | undefined;

  constructor(locals: string[], expressions: ExpressionList | undefined) {
    super(NodeType.LOCAL_ASSIGNMENT);

    this.locals = locals;
    this.expressions = expressions;
  }
}
export class VariableAssignment extends ASTNode {
  public lvalues: ASTNode[];
  public expressions: ASTNodeList;

  constructor(lvalues: ASTNode[], expressions: ASTNodeList) {
    super(NodeType.VARIABLE_ASSIGNMENT);

    this.lvalues = lvalues;
    this.expressions = expressions;
  }
}
export class FunctionDeclaration extends ASTNode {
  public variable: VariableNode;
  public fields: string[];
  public parameters: string[];
  public chunk: Chunk;
  public isMethod = false;

  constructor(
    variable: VariableNode,
    fields: string[],
    parameters: string[],
    chunk: Chunk,
    isMethod = false,
  ) {
    super(NodeType.FUNCTION_DECLARATION);

    this.variable = variable;
    this.fields = fields;
    this.parameters = parameters;
    this.chunk = chunk;
    this.isMethod = isMethod;
  }
}
export class LocalFunctionDeclaration extends ASTNode {
  public name: string;
  public parameters: string[];
  public chunk: Chunk;

  constructor(name: string, parameters: string[], chunk: Chunk) {
    super(NodeType.LOCAL_FUNCTION_DECLARATION);

    this.name = name;
    this.parameters = parameters;
    this.chunk = chunk;
  }
}
export class ReturnStatement extends ASTNode {
  public expressions: ExpressionList;

  constructor(expressions: ExpressionList) {
    super(NodeType.RETURN_STATEMENT);

    this.expressions = expressions;
  }
}
export class BreakStatement extends ASTNode {
  constructor() {
    super(NodeType.BREAK_STATEMENT);
  }
}
export class DoStatement extends ASTNode {
  public chunk: Chunk;

  constructor(chunk: Chunk) {
    super(NodeType.DO_STATEMENT);

    this.chunk = chunk;
  }
}
export class WhileStatement extends ASTNode {
  public condition: ASTNode;
  public chunk: Chunk;

  constructor(condition: ASTNode, chunk: Chunk) {
    super(NodeType.WHILE_STATEMENT);

    this.condition = condition;
    this.chunk = chunk;
  }
}
export class RepeatUntilStatement extends ASTNode {
  public chunk: Chunk;
  public condition: ASTNode;

  constructor(chunk: Chunk, condition: ASTNode) {
    super(NodeType.REPEAT_UNTIL_STATEMENT);

    this.chunk = chunk;
    this.condition = condition;
  }
}
export class NumericForStatement extends ASTNode {
  public variable: string;
  public start: ASTNode;
  public end: ASTNode;
  public step: ASTNode | null;
  public chunk: Chunk;

  constructor(
    variable: string,
    start: ASTNode,
    end: ASTNode,
    step: ASTNode | null,
    chunk: Chunk,
  ) {
    super(NodeType.NUMERIC_FOR_STATEMENT);

    this.variable = variable;
    this.start = start;
    this.end = end;
    this.step = step;
    this.chunk = chunk;
  }
}
export class GenericForStatement extends ASTNode {
  public variables: string[];
  public generator: ASTNode;
  public state: ASTNode | undefined;
  public control: ASTNode | undefined;
  public chunk: Chunk;

  constructor(
    variables: string[],
    generator: ASTNode,
    state: ASTNode | undefined,
    control: ASTNode | undefined,
    chunk: Chunk,
  ) {
    super(NodeType.GENERIC_FOR_STATEMENT);

    this.variables = variables;
    this.generator = generator;
    this.state = state;
    this.control = control;
    this.chunk = chunk;
  }
}
export class IfBranch extends ASTNode {
  public condition: ASTNode | null;
  public chunk: Chunk;

  constructor(condition: ASTNode | null, chunk: Chunk) {
    super(NodeType.IF_BRANCH);

    this.condition = condition;
    this.chunk = chunk;
  }
}
export class IfStatement extends ASTNode {
  public branches: IfBranchList;

  constructor(branches: IfBranchList) {
    super(NodeType.IF_STATEMENT);

    this.branches = branches;
  }
}
