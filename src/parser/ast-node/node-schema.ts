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

  // Variable node //
  [NodeType.VARIABLE]: [],

  // Primitive nodes //
  [NodeType.NUMBER_LITERAL]: [],
  [NodeType.STRING_LITERAL]: [],
  [NodeType.VALUE_LITERAL]: [],
  [NodeType.VARARG_LITERAL]: [],

  // Expression nodes //
  [NodeType.BINARY_OPERATOR]: ["left", "right"],
  [NodeType.UNARY_OPERATOR]: ["operand"],
  [NodeType.FUNCTION_CALL]: ["expression", "arguments"],
  [NodeType.TABLE_INDEX]: ["expression", "index"],
  [NodeType.ANONYMOUS_FUNCTION]: ["chunk"],
  [NodeType.TABLE_ELEMENT]: ["key", "value"],
  [NodeType.TABLE_CONSTRUCTOR]: ["elements"],

  // Statement nodes //
  [NodeType.LOCAL_ASSIGNMENT]: ["expressions"],
  [NodeType.VARIABLE_ASSIGNMENT]: ["expressions"],
  [NodeType.FUNCTION_DECLARATION]: ["chunk"],
  [NodeType.LOCAL_FUNCTION_DECLARATION]: ["chunk"],
  [NodeType.RETURN_STATEMENT]: ["expressions"],
  [NodeType.BREAK_STATEMENT]: [],
  [NodeType.DO_STATEMENT]: ["chunk"],
  [NodeType.WHILE_STATEMENT]: ["condition", "chunk"],
  [NodeType.REPEAT_UNTIL_STATEMENT]: ["condition", "chunk"],
  [NodeType.NUMERIC_FOR_STATEMENT]: ["start", "end", "step", "chunk"],
  [NodeType.GENERIC_FOR_STATEMENT]: ["generator", "state", "control", "chunk"],
  [NodeType.IF_BRANCH]: ["condition", "chunk"],
  [NodeType.IF_STATEMENT]: ["branches"],
};
