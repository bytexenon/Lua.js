/* Imports */
import { Node, NodeList } from "./base.js";
export { Node, NodeList };

/* List nodes */
export class Program extends NodeList {
  constructor() {
    super("Program");
  }
}
export class Chunk extends NodeList {
  constructor() {
    super("Chunk");
  }
}
export class ExpressionList extends NodeList {
  constructor() {
    super("ExpressionList");
  }
}
export class IfBranchList extends NodeList {
  constructor() {
    super("IfBranchList");
  }
}

/* Variable nodes */
class VariableNode extends Node {
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
export class NumberLiteral extends Node {
  constructor(value: string) {
    super("NumberLiteral", { value });
  }
}
export class StringLiteral extends Node {
  constructor(value: string) {
    super("StringLiteral", { value });
  }
}
export class BooleanLiteral extends Node {
  constructor(value: string) {
    super("BooleanLiteral", { value });
  }
}
export class VarargLiteral extends Node {
  constructor() {
    super("VarargLiteral");
  }
}

/* Expression nodes */
export class BinaryOperator extends Node {
  constructor(operator: string, left: Node, right: Node) {
    super("BinaryOperator", { operator, left, right });
  }
}
export class UnaryOperator extends Node {
  constructor(operator: string, operand: Node) {
    super("UnaryOperator", { operator, operand });
  }
}
export class FunctionCall extends Node {
  constructor(expression: Node, argumentsList: NodeList) {
    super("FunctionCall", { expression, arguments: argumentsList });
  }
}

/* Statement nodes */
export class LocalStatement extends Node {
  constructor(locals: string[], expressions: ExpressionList | undefined) {
    super("LocalStatement", { locals, expressions });
  }
}
export class WhileStatement extends Node {
  constructor(condition: Node, chunk: Chunk) {
    super("WhileStatement", { condition, chunk });
  }
}
export class IfBranch extends Node {
  constructor(condition: Node | null, chunk: Chunk) {
    super("IfBranch", { condition, chunk });
  }
}
export class IfStatement extends Node {
  constructor(branches: IfBranchList) {
    super("IfStatement", { branches });
  }
}
export class VariableAssignment extends Node {
  constructor(variable: Node, expression: Node) {
    super("VariableAssignment", { variable, expression });
  }
}
