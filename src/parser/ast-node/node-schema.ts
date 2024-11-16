import { NodeType } from "./ast-node";

/**
 * A schema defining the traversable fields for different types of nodes in the parser.
 * Each key represents a node type, and the value is an array of field names that can be traversed.
 */
export const NODE_SCHEMA: Record<NodeType, string[]> = {
  [NodeType.AST_NODE]: [],
  [NodeType.AST_NODE_LIST]: [],

  // List nodes //
  [NodeType.PROGRAM]: [],
  [NodeType.CHUNK]: [],
  [NodeType.EXPRESSION_LIST]: [],
  [NodeType.IF_BRANCH_LIST]: [],

  // Expression nodes //
  [NodeType.BINARY_OPERATOR]: ["left", "right"],
  [NodeType.UNARY_OPERATOR]: ["operand"],
  [NodeType.FUNCTION_CALL]: ["expression", "arguments"],
  [NodeType.TABLE_INDEX]: ["expression", "index"],
  [NodeType.NUMBER_LITERAL]: [],
  [NodeType.STRING_LITERAL]: [],
  [NodeType.VARARG_LITERAL]: [],
  [NodeType.BOOLEAN_LITERAL]: [],
  [NodeType.VARIABLE]: [],
  [NodeType.ANONYMOUS_FUNCTION]: ["chunk"],
  [NodeType.TABLE_ELEMENT]: ["key", "value"],
  [NodeType.TABLE_CONSTRUCTOR]: ["elements"],

  // Statement nodes //
  [NodeType.LOCAL_STATEMENT]: ["expressions"],
  [NodeType.WHILE_STATEMENT]: ["condition", "chunk"],
  [NodeType.IF_STATEMENT]: ["branches"],
  [NodeType.IF_BRANCH]: ["condition", "chunk"],
  [NodeType.DO_STATEMENT]: ["chunk"],
  [NodeType.VARIABLE_ASSIGNMENT]: ["expressions"],
  [NodeType.RETURN_STATEMENT]: ["expressions"],
  [NodeType.BREAK_STATEMENT]: [],
  [NodeType.NUMERIC_FOR_STATEMENT]: ["start", "end", "step", "chunk"],
  [NodeType.GENERIC_FOR_STATEMENT]: ["generator", "state", "control", "chunk"],
  [NodeType.FUNCTION_DECLARATION]: ["chunk"],
  [NodeType.LOCAL_FUNCTION_DECLARATION]: ["chunk"],
  [NodeType.REPEAT_UNTIL_STATEMENT]: ["condition", "chunk"],
};
