// Length of surrounding tokens to show in error messages (in both directions)
export const ERROR_SURROUNDING_LENGTH = 10;

// Operator precedence levels
// prettier-ignore
export const OPERATOR_PRECEDENCE: Readonly<Record<string, readonly [number, number]>> = {
  "+":   [6, 6],  "-":   [6, 6],
  "*":   [7, 7],  "/":   [7, 7],
  "%":   [7, 7],

  "^":   [10, 9], "..":  [5, 4],

  "==":  [3, 3],  "~=":  [3, 3],
  "<":   [3, 3],  ">":   [3, 3],
  "<=":  [3, 3],  ">=":  [3, 3],

  "and": [2, 2],  "or":  [1, 1],
};

// Binary operators
// prettier-ignore
export const BINARY_OPERATORS = new Set([
  "+",  "-",  "*",  "/",
  "%",  "^",  "..", "==",
  "~=", "<",  ">",  "<=",
  ">=", "and", "or"
]);

// Unary operators
export const UNARY_OPERATORS = new Set(["-", "not", "#"]);
export const UNARY_PRECEDENCE = 8;

// Keywords that stop parsing current block (chunk)
export const STOP_KEYWORDS = new Set(["end", "else", "elseif", "until"]);
