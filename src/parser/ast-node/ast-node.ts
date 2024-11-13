/* Imports */
import { ASTNode, ASTNodeList } from "./base.js";
export { ASTNode, ASTNodeList };

/* List nodes */
export class Program extends ASTNodeList {
  constructor() {
    super("Program");
  }
}
export class Chunk extends ASTNodeList {
  constructor() {
    super("Chunk");
  }
}
export class ExpressionList extends ASTNodeList {
  constructor() {
    super("ExpressionList");
  }
}
export class IfBranchList extends ASTNodeList {
  constructor() {
    super("IfBranchList");
  }
}

/* Variable nodes */
export class VariableNode extends ASTNode {
  constructor(name: string, variableType: string) {
    super("Variable", { variableType, name });
  }
}
export class LocalVariable extends VariableNode {
  constructor(name: string) {
    super(name, "Local");
  }
}
export class GlobalVariable extends VariableNode {
  constructor(name: string) {
    super(name, "Global");
  }
}
export class UpvalueVariable extends VariableNode {
  constructor(name: string) {
    super(name, "Upvalue");
  }
}

/* Primitive nodes */
export class NumberLiteral extends ASTNode {
  constructor(value: string) {
    super("NumberLiteral", { value });
  }
}
export class StringLiteral extends ASTNode {
  constructor(value: string) {
    super("StringLiteral", { value });
  }
}
export class BooleanLiteral extends ASTNode {
  constructor(value: string) {
    super("BooleanLiteral", { value });
  }
}
export class VarargLiteral extends ASTNode {
  constructor() {
    super("VarargLiteral");
  }
}

/* Expression nodes */
export class BinaryOperator extends ASTNode {
  constructor(operator: string, left: ASTNode, right: ASTNode) {
    super("BinaryOperator", { operator, left, right });
  }
}
export class UnaryOperator extends ASTNode {
  constructor(operator: string, operand: ASTNode) {
    super("UnaryOperator", { operator, operand });
  }
}
export class FunctionCall extends ASTNode {
  constructor(expression: ASTNode, argumentsList: ASTNodeList) {
    super("FunctionCall", { expression, arguments: argumentsList });
  }
}

/* Statement nodes */
export class LocalStatement extends ASTNode {
  constructor(locals: string[], expressions: ExpressionList | undefined) {
    super("LocalStatement", { locals, expressions });
  }
}
export class WhileStatement extends ASTNode {
  constructor(condition: ASTNode, chunk: Chunk) {
    super("WhileStatement", { condition, chunk });
  }
}
export class IfBranch extends ASTNode {
  constructor(condition: ASTNode | null, chunk: Chunk) {
    super("IfBranch", { condition, chunk });
  }
}
export class IfStatement extends ASTNode {
  constructor(branches: IfBranchList) {
    super("IfStatement", { branches });
  }
}
export class VariableAssignment extends ASTNode {
  constructor(variable: ASTNode, expression: ASTNode) {
    super("VariableAssignment", { variable, expression });
  }
}
