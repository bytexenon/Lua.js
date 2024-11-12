/**
 * A schema defining the traversable fields for different types of nodes in the parser.
 * Each key represents a node type, and the value is an array of field names that can be traversed.
 */
export const NODE_SCHEMA: { [key: string]: string[] } = {
  // List nodes //
  Program: [],
  Chunk: [],
  ExpressionList: [],
  IfBranchList: [],

  // Expression nodes //
  BinaryOperator: ["left", "right"],
  UnaryOperator: ["operand"],
  FunctionCall: ["expression", "arguments"],
  NumberLiteral: [],
  StringLiteral: [],
  VarargLiteral: [],
  Variable: [],

  // Statement nodes //
  LocalStatement: ["expressions"],
  WhileStatement: ["condition", "chunk"],
  IfStatement: ["branches"],
  IfBranch: ["condition", "chunk"],
};
