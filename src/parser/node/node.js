/* Imports */
import { Node, NodeList } from "./base.js";

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
  constructor(name, variableType) {
    super("Variable", { variableType, name });
  }
}
export class LocalVariable extends VariableNode {
  constructor(name) {
    super(name, "Local");
  }
}
export class GlobalVariable extends VariableNode {
  constructor(name) {
    super(name, "Global");
  }
}
export class UpvalueVariable extends VariableNode {
  constructor(name) {
    super(name, "Upvalue");
  }
}

/* Primitive nodes */
export class NumberLiteral extends Node {
  constructor(value) {
    super("NumberLiteral", { value });
  }
}
export class StringLiteral extends Node {
  constructor(value) {
    super("StringLiteral", { value });
  }
}
export class BooleanLiteral extends Node {
  constructor(value) {
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
  constructor(operator, left, right) {
    super("BinaryOperator", { operator, left, right });
  }
}
export class UnaryOperator extends Node {
  constructor(operator, operand) {
    super("UnaryOperator", { operator, operand });
  }
}
export class FunctionCall extends Node {
  constructor(expression, argumentsList) {
    super("FunctionCall", { expression, arguments: argumentsList });
  }
}

/* Statement nodes */
export class LocalStatement extends Node {
  constructor(locals, expressions) {
    super("LocalStatement", { locals, expressions });
  }
}
export class WhileStatement extends Node {
  constructor(condition, chunk) {
    super("WhileStatement", { condition, chunk });
  }
}
export class IfBranch extends Node {
  constructor(condition, chunk) {
    super("IfBranch", { condition, chunk });
  }
}
export class IfStatement extends Node {
  constructor(branches) {
    super("IfStatement", { branches });
  }
}
export class VariableAssignment extends Node {
  constructor(variable, expression) {
    super("VariableAssignment", { variable, expression });
  }
}