/**
 * Instructions for modifying node classes:
 *
 * 1. Update Node Class:
 *    - Add, rename, or remove the node class in this file.
 *
 * 2. Update Node Enum:
 *    - Ensure the node type entries in node enum are consistent with the changes in this file.
 */

/* Imports */
import { ASTNode, ASTNodeList } from "./base.js";

export { ASTNode, ASTNodeList };

/**
 * Enum for node types.
 */
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

/**
 * Enum for variable types.
 */
export const enum VariableType {
  LOCAL = "LOCAL",
  GLOBAL = "GLOBAL",
  UPVALUE = "UPVALUE",
}

/**
 * Type for binary operators.
 */
// prettier-ignore
export type BinaryOperatorType =
  | "+"  | "-"   | "*"   | "/"
  | "%"  | "^"   | ".."  | "=="
  | "~=" | "<"   | "<="  | ">"
  | ">=" | "and" | "or";

/**
 * Type for unary operators.
 */
export type UnaryOperatorType = "not" | "-" | "#";

/* List nodes */

/**
 * Class representing a program node.
 */
export class Program extends ASTNodeList {
  /**
   * Creates an instance of Program.
   * @param children Child nodes to add to the program node.
   */
  constructor(children?: ASTNode[]) {
    super(NodeType.PROGRAM, children);
  }
}

/**
 * Class representing a chunk node.
 */
export class Chunk extends ASTNodeList {
  /**
   * Creates an instance of Chunk.
   * @param children Child nodes to add to the chunk node.
   */
  constructor(children?: ASTNode[]) {
    super(NodeType.CHUNK, children);
  }
}

/**
 * Class representing an expression list node.
 */
export class ExpressionList extends ASTNodeList {
  /**
   * Creates an instance of ExpressionList.
   * @param children Child nodes to add to the expression list node.
   */
  constructor(children?: ASTNode[]) {
    super(NodeType.EXPRESSION_LIST, children);
  }
}

/**
 * Class representing an if-branch list node.
 */
export class IfBranchList extends ASTNodeList {
  /**
   * Creates an instance of IfBranchList.
   * @param children Child nodes to add to the if-branch list node.
   */
  constructor(children?: ASTNode[]) {
    super(NodeType.IF_BRANCH_LIST, children);
  }
}

/* Variable nodes */

/**
 * Class representing a variable node.
 */
export abstract class VariableNode extends ASTNode {
  public override readonly traversableFields = [];
  public abstract variableType: VariableType;

  /**
   * Creates an instance of VariableNode.
   * @param name The name for the variable node.
   */
  constructor(public name: string) {
    super(NodeType.VARIABLE);
  }
}

/**
 * Class representing a local variable node.
 */
export class LocalVariable extends VariableNode {
  public override variableType = VariableType.LOCAL;

  /**
   * Creates an instance of LocalVariable.
   * @param name The name for the local variable node.
   */
  constructor(name: string) {
    super(name);
  }
}

/**
 * Class representing a global variable node.
 */
export class GlobalVariable extends VariableNode {
  public override variableType = VariableType.GLOBAL;

  /**
   * Creates an instance of GlobalVariable.
   * @param name The name for the global variable node.
   */
  constructor(name: string) {
    super(name);
  }
}

/**
 * Class representing an upvalue variable node.
 */
export class UpvalueVariable extends VariableNode {
  public override variableType = VariableType.UPVALUE;

  /**
   * Creates an instance of UpvalueVariable.
   * @param name The name for the upvalue variable node.
   */
  constructor(name: string) {
    super(name);
  }
}

/* Primitive nodes */

/**
 * Class representing a number literal node.
 */
export class NumberLiteral extends ASTNode {
  public override readonly traversableFields = [];

  /**
   * Creates an instance of NumberLiteral.
   * @param value The numeric value represented as a string.
   */
  constructor(public value: string) {
    super(NodeType.NUMBER_LITERAL);
  }
}

/**
 * Class representing a string literal node.
 */
export class StringLiteral extends ASTNode {
  public override readonly traversableFields = [];

  /**
   * Creates an instance of StringLiteral.
   * @param value The string content represented by the string literal.
   */
  constructor(public value: string) {
    super(NodeType.STRING_LITERAL);
  }
}

/**
 * Class representing a value literal node.
 */
export class ValueLiteral extends ASTNode {
  public override readonly traversableFields = [];

  /**
   * Creates an instance of ValueLiteral.
   * @param value The string representation of the value literal (e.g., `nil`, `true`, `false`).
   * @example
   * ```ts
   * new ValueLiteral("nil");
   * ```
   * @example
   * ```ts
   * new ValueLiteral("true");
   * ```
   */
  constructor(public value: string) {
    super(NodeType.VALUE_LITERAL);
  }
}

/**
 * Class representing a vararg literal node.
 */
export class VarargLiteral extends ASTNode {
  public override readonly traversableFields = [];

  /**
   * Creates an instance of VarargLiteral.
   */
  constructor() {
    super(NodeType.VARARG_LITERAL);
  }
}

/* Expression nodes */

/**
 * Class representing a binary operator node.
 */
export class BinaryOperator extends ASTNode {
  public override readonly traversableFields = ["left", "right"];

  /**
   * Creates an instance of BinaryOperator.
   * @param operator The operator itself (e.g., `+`, `-`, `*`, etc.).
   * @param left The left operand of the binary operation.
   * @param right The right operand of the binary operation.
   * @example
   * ```ts
   * new BinaryOperator("+",
   *   new NumberLiteral("1"),
   *   new NumberLiteral("2")
   * );
   * ```
   */
  constructor(
    public operator: BinaryOperatorType,
    public left: ASTNode,
    public right: ASTNode,
  ) {
    super(NodeType.BINARY_OPERATOR);
  }
}

/**
 * Class representing a unary operator node.
 */
export class UnaryOperator extends ASTNode {
  public override readonly traversableFields = ["operand"];

  /**
   * Creates an instance of UnaryOperator.
   * @param operator The operator itself (e.g., `not`, `#`, `-`, etc.).
   * @param operand The operand of the unary operation.
   * @example
   * ```ts
   * new UnaryOperator("not", new ValueLiteral("true"));
   * ```
   * @example
   * ```ts
   * new UnaryOperator("#", new VariableNode("table", VariableType.LOCAL));
   * ```
   */
  constructor(
    public operator: UnaryOperatorType,
    public operand: ASTNode,
  ) {
    super(NodeType.UNARY_OPERATOR);
  }
}

/**
 * Class representing a function call node.
 */
export class FunctionCall extends ASTNode {
  public override readonly traversableFields = ["expression", "argumentsList"];

  /**
   * Creates an instance of FunctionCall.
   * @param expression The expression representing the function to be called (aka the callee).
   * @param argumentsList The list of arguments to pass to the function.
   * @param isMethodCall Indicates whether it is a method call (e.g., `object:method()`).
   * @example
   * ```ts
   * new FunctionCall(
   *   new VariableNode("print", VariableType.GLOBAL),
   *   new ExpressionList([
   *     new StringLiteral("Hello, World!"),
   *   ])
   * );
   * ```
   */
  constructor(
    public expression: ASTNode,
    public argumentsList: ASTNodeList,
    public isMethodCall = false,
  ) {
    super(NodeType.FUNCTION_CALL);
  }
}

/**
 * Class representing a table index node.
 */
export class TableIndex extends ASTNode {
  public override readonly traversableFields = ["expression", "index"];

  /**
   * Creates an instance of TableIndex.
   * @param expression The expression representing the table.
   * @param index The expression representing the index.
   * @example
   * ```ts
   * new TableIndex(
   *   new VariableNode("table", VariableType.LOCAL),
   *   new StringLiteral("key")
   * );
   * ```
   */
  constructor(
    public expression: ASTNode,
    public index: ASTNode,
  ) {
    super(NodeType.TABLE_INDEX);
  }
}

/**
 * Class representing an anonymous function node.
 */
export class AnonymousFunction extends ASTNode {
  public override readonly traversableFields = ["chunk"];

  /**
   * Creates an instance of AnonymousFunction.
   * @param parameters The list of parameters.
   * @param chunk The function body.
   */
  constructor(
    public parameters: string[],
    public chunk: Chunk,
  ) {
    super(NodeType.ANONYMOUS_FUNCTION);
  }
}

/**
 * Class representing a table element node.
 */
export class TableElement extends ASTNode {
  public override readonly traversableFields = ["key", "value"];

  /**
   * Creates an instance of TableElement.
   * @param key The expression representing the key of the table element.
   * @param value The expression representing the value of the table element.
   * @param isImplicitKey Indicates if the key is implicit (e.g., `[1] = "value"` vs. `"value"`).
   * @example
   * ```ts
   * new TableElement(
   *   new NumberLiteral("1"),
   *   new StringLiteral("value")
   *   false
   * );
   * ```
   */
  constructor(
    public key: ASTNode,
    public value: ASTNode,
    public isImplicitKey = false,
  ) {
    super(NodeType.TABLE_ELEMENT);
  }
}

/**
 * Class representing a table constructor node.
 */
export class TableConstructor extends ASTNode {
  public override readonly traversableFields = ["elements"];

  /**
   * Creates an instance of TableConstructor.
   * @param elements The list of table elements.
   */
  constructor(public elements: ASTNodeList) {
    super(NodeType.TABLE_CONSTRUCTOR);
  }
}

/* Statement nodes */

/**
 * Class representing a local assignment node.
 */
export class LocalAssignment extends ASTNode {
  public override readonly traversableFields = ["expressions"];

  /**
   * Creates an instance of LocalAssignment.
   * @param locals The list of local variables.
   * @param expressions The list of expressions.
   */
  constructor(
    public locals: string[],
    public expressions: ExpressionList | undefined,
  ) {
    super(NodeType.LOCAL_ASSIGNMENT);
  }
}

/**
 * Class representing a variable assignment node.
 */
export class VariableAssignment extends ASTNode {
  public override readonly traversableFields = ["lvalues", "expressions"];

  /**
   * Creates an instance of VariableAssignment.
   * @param lvalues The list of left-hand side variables.
   * @param expressions The list of expressions.
   */
  constructor(
    public lvalues: ASTNode[],
    public expressions: ASTNodeList,
  ) {
    super(NodeType.VARIABLE_ASSIGNMENT);
  }
}

/**
 * Class representing a function declaration node.
 */
export class FunctionDeclaration extends ASTNode {
  public override readonly traversableFields = ["variable", "chunk"];

  /**
   * Creates an instance of FunctionDeclaration.
   * @param variable The variable node representing the function name.
   * @param fields The list of fields.
   * @param parameters The list of parameters.
   * @param chunk The function body.
   * @param isMethod Indicates if the function is a method.
   */
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

/**
 * Class representing a local function declaration node.
 */
export class LocalFunctionDeclaration extends ASTNode {
  public override readonly traversableFields = ["chunk"];

  /**
   * Creates an instance of LocalFunctionDeclaration.
   * @param name User-defined name of the function.
   * @param parameters A of parameters.
   * @param chunk The function body.
   */
  constructor(
    public name: string,
    public parameters: string[],
    public chunk: Chunk,
  ) {
    super(NodeType.LOCAL_FUNCTION_DECLARATION);
  }
}

/**
 * Class representing a return statement node.
 */
export class ReturnStatement extends ASTNode {
  public override readonly traversableFields = ["expressions"];

  /**
   * Creates an instance of ReturnStatement.
   * @param expressions The list of expressions to return.
   */
  constructor(public expressions: ExpressionList) {
    super(NodeType.RETURN_STATEMENT);
  }
}

/**
 * Class representing a break statement node.
 */
export class BreakStatement extends ASTNode {
  public override readonly traversableFields = [];

  /**
   * Creates an instance of BreakStatement.
   */
  constructor() {
    super(NodeType.BREAK_STATEMENT);
  }
}

/**
 * Class representing a do statement node.
 */
export class DoStatement extends ASTNode {
  public override readonly traversableFields = ["chunk"];

  /**
   * Creates an instance of DoStatement.
   * @param chunk The body of the do statement.
   */
  constructor(public chunk: Chunk) {
    super(NodeType.DO_STATEMENT);
  }
}

/**
 * Class representing a while statement node.
 */
export class WhileStatement extends ASTNode {
  public override readonly traversableFields = ["condition", "chunk"];

  /**
   * Creates an instance of WhileStatement.
   * @param condition The condition to evaluate.
   * @param chunk The body of the while statement.
   */
  constructor(
    public condition: ASTNode,
    public chunk: Chunk,
  ) {
    super(NodeType.WHILE_STATEMENT);
  }
}

/**
 * Class representing a repeat-until statement node.
 */
export class RepeatUntilStatement extends ASTNode {
  public override readonly traversableFields = ["chunk", "condition"];

  /**
   * Creates an instance of RepeatUntilStatement.
   * @param chunk The body of the repeat-until statement.
   * @param condition The condition to evaluate.
   */
  constructor(
    public chunk: Chunk,
    public condition: ASTNode,
  ) {
    super(NodeType.REPEAT_UNTIL_STATEMENT);
  }
}

/**
 * Class representing a numeric for statement node.
 */
export class NumericForStatement extends ASTNode {
  public override readonly traversableFields = [
    "start",
    "end",
    "step",
    "chunk",
  ];

  /**
   * Creates an instance of NumericForStatement.
   * @param variable The loop variable.
   * @param start The start expression.
   * @param end The end expression.
   * @param step The step expression.
   * @param chunk The body of the for loop.
   */
  constructor(
    public variable: string,
    public start: ASTNode,
    public end: ASTNode,
    public step: ASTNode | undefined,
    public chunk: Chunk,
  ) {
    super(NodeType.NUMERIC_FOR_STATEMENT);
  }
}

/**
 * Class representing a generic for statement node.
 */
export class GenericForStatement extends ASTNode {
  public override readonly traversableFields = [
    "generator",
    "state",
    "control",
    "chunk",
  ];

  /**
   * Creates an instance of GenericForStatement.
   * @param variables The list of loop variables.
   * @param generator The generator expression (iterator).
   * @param state The state expression (initial value).
   * @param control The control expression (step).
   * @param chunk The body of the for loop.
   */
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

/**
 * Class representing an if branch node.
 */
export class IfBranch extends ASTNode {
  public override readonly traversableFields = ["condition", "chunk"];

  /**
   * Creates an instance of IfBranch.
   * @param condition The condition to evaluate.
   * @param chunk The body of the if branch.
   */
  constructor(
    public condition: ASTNode | undefined,
    public chunk: Chunk,
  ) {
    super(NodeType.IF_BRANCH);
  }
}

/**
 * Class representing an if statement node.
 */
export class IfStatement extends ASTNode {
  public override readonly traversableFields = ["branches"];

  /**
   * Creates an instance of IfStatement.
   * @param branches The list of if branches.
   */
  constructor(public branches: IfBranchList) {
    super(NodeType.IF_STATEMENT);
  }
}
