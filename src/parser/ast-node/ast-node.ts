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
  AST_NODE,
  AST_NODE_LIST,

  // List nodes //
  PROGRAM,
  CHUNK,
  EXPRESSION_LIST,
  IF_BRANCH_LIST,

  // Variable node //
  VARIABLE,

  // Primitive nodes //
  NUMBER_LITERAL,
  STRING_LITERAL,
  BOOLEAN_LITERAL,
  VARARG_LITERAL,

  // Expression nodes //
  BINARY_OPERATOR,
  UNARY_OPERATOR,
  FUNCTION_CALL,
  TABLE_INDEX,
  ANONYMOUS_FUNCTION,
  TABLE_ELEMENT,
  TABLE_CONSTRUCTOR,

  // Statement nodes //
  LOCAL_ASSIGNMENT,
  VARIABLE_ASSIGNMENT,
  FUNCTION_DECLARATION,
  LOCAL_FUNCTION_DECLARATION,
  RETURN_STATEMENT,
  BREAK_STATEMENT,
  DO_STATEMENT,
  WHILE_STATEMENT,
  REPEAT_UNTIL_STATEMENT,
  NUMERIC_FOR_STATEMENT,
  GENERIC_FOR_STATEMENT,
  IF_BRANCH,
  IF_STATEMENT,
}
export const enum VariableType {
  LOCAL,
  GLOBAL,
  UPVALUE,
}

/* List nodes */
export class Program extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.PROGRAM, undefined, children);
  }
}
export class Chunk extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.CHUNK, undefined, children);
  }
}
export class ExpressionList extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.EXPRESSION_LIST, undefined, children);
  }
}
export class IfBranchList extends ASTNodeList {
  constructor(children?: ASTNode[]) {
    super(NodeType.IF_BRANCH_LIST, undefined, children);
  }
}

/* Variable nodes */
export class VariableNode extends ASTNode {
  constructor(name: string, variableType: VariableType) {
    super(NodeType.VARIABLE, { variableType, name });
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
  constructor(value: string) {
    super(NodeType.NUMBER_LITERAL, { value });
  }
}
export class StringLiteral extends ASTNode {
  constructor(value: string) {
    super(NodeType.STRING_LITERAL, { value });
  }
}
export class BooleanLiteral extends ASTNode {
  constructor(value: string) {
    super(NodeType.BOOLEAN_LITERAL, { value });
  }
}
export class VarargLiteral extends ASTNode {
  constructor() {
    super(NodeType.VARARG_LITERAL);
  }
}

/* Expression nodes */
export class BinaryOperator extends ASTNode {
  constructor(operator: string, left: ASTNode, right: ASTNode) {
    super(NodeType.BINARY_OPERATOR, { operator, left, right });
  }
}
export class UnaryOperator extends ASTNode {
  constructor(operator: string, operand: ASTNode) {
    super(NodeType.UNARY_OPERATOR, { operator, operand });
  }
}
export class FunctionCall extends ASTNode {
  constructor(
    expression: ASTNode,
    argumentsList: ASTNodeList,
    isMethodCall = false,
  ) {
    super(NodeType.FUNCTION_CALL, {
      expression,
      arguments: argumentsList,
      isMethodCall,
    });
  }
}
export class TableIndex extends ASTNode {
  constructor(expression: ASTNode, index: ASTNode) {
    super(NodeType.TABLE_INDEX, { expression, index });
  }
}
export class AnonymousFunction extends ASTNode {
  constructor(parameters: string[], chunk: Chunk) {
    super(NodeType.ANONYMOUS_FUNCTION, { parameters, chunk });
  }
}
export class TableElement extends ASTNode {
  constructor(key: ASTNode, value: ASTNode, isImplicitKey = false) {
    super(NodeType.TABLE_ELEMENT, { key, value, isImplicitKey });
  }
}
export class TableConstructor extends ASTNode {
  constructor(elements: ASTNodeList) {
    super(NodeType.TABLE_CONSTRUCTOR, { elements });
  }
}

/* Statement nodes */
export class LocalAssignment extends ASTNode {
  constructor(locals: string[], expressions: ExpressionList | undefined) {
    super(NodeType.LOCAL_ASSIGNMENT, { locals, expressions });
  }
}
export class VariableAssignment extends ASTNode {
  constructor(variable: ASTNode, expressions: ASTNodeList) {
    super(NodeType.VARIABLE_ASSIGNMENT, { variable, expression: expressions });
  }
}
export class FunctionDeclaration extends ASTNode {
  constructor(
    name: string,
    variable: VariableNode,
    fields: string[],
    parameters: string[],
    chunk: Chunk,
    isMethod = false,
  ) {
    super(NodeType.FUNCTION_DECLARATION, {
      name,
      variable,
      fields,
      parameters,
      chunk,
      isMethod,
    });
  }
}
export class LocalFunctionDeclaration extends ASTNode {
  constructor(name: string, parameters: string[], chunk: Chunk) {
    super(NodeType.LOCAL_FUNCTION_DECLARATION, { name, parameters, chunk });
  }
}
export class ReturnStatement extends ASTNode {
  constructor(expressions: ExpressionList) {
    super(NodeType.RETURN_STATEMENT, { expressions });
  }
}
export class BreakStatement extends ASTNode {
  constructor() {
    super(NodeType.BREAK_STATEMENT);
  }
}
export class DoStatement extends ASTNode {
  constructor(chunk: Chunk) {
    super(NodeType.DO_STATEMENT, { chunk });
  }
}
export class WhileStatement extends ASTNode {
  constructor(condition: ASTNode, chunk: Chunk) {
    super(NodeType.WHILE_STATEMENT, { condition, chunk });
  }
}
export class RepeatUntilStatement extends ASTNode {
  constructor(chunk: Chunk, condition: ASTNode) {
    super(NodeType.REPEAT_UNTIL_STATEMENT, { chunk, condition });
  }
}
export class NumericForStatement extends ASTNode {
  constructor(
    variable: string,
    start: ASTNode,
    end: ASTNode,
    step: ASTNode | null,
    chunk: Chunk,
  ) {
    super(NodeType.NUMERIC_FOR_STATEMENT, {
      variable,
      start,
      end,
      step,
      chunk,
    });
  }
}
export class GenericForStatement extends ASTNode {
  constructor(
    variables: string[],
    generator: ASTNode,
    state: ASTNode | undefined,
    control: ASTNode | undefined,
    chunk: Chunk,
  ) {
    super(NodeType.GENERIC_FOR_STATEMENT, {
      variables,
      generator,
      state,
      control,
      chunk,
    });
  }
}
export class IfBranch extends ASTNode {
  constructor(condition: ASTNode | null, chunk: Chunk) {
    super(NodeType.IF_BRANCH, { condition, chunk });
  }
}
export class IfStatement extends ASTNode {
  constructor(branches: IfBranchList) {
    super(NodeType.IF_STATEMENT, { branches });
  }
}
