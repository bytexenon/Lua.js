/* Dependencies */
import { makeTrie } from "../utils/utils.js";

// prettier-ignore
export const KEYWORDS = new Set([
  "while",    "do",     "end",   "for",
  "local",    "repeat", "until", "return",
  "in",       "if",     "else",  "elseif",
  "function", "then",   "break",
]);

// prettier-ignore
export const OPERATORS: readonly string[] = [
  "^", "*", "/", "%",
  "+", "-", "<", ">",
  "#",

  "<=", ">=", "==", "~=",
  "and", "or", "not", ".."
];

// prettier-ignore
export const VALID_CHARACTERS = new Set([
  // All the characters expected to be valid
  "(", ")",
  "[", "]",
  "{", "}",

  ".", ",",
  ";", ":",
  "="
])

export const TOKENIZER_ESCAPED_CHARACTER_CONVERSIONS: Record<string, string> = {
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
  v: "\v",

  "\\": "\\",
  '"': '"',
  "'": "'",
};

export const OPERATOR_TRIE = makeTrie(OPERATORS);
export const OPERATOR_KEYWORDS = new Set(["and", "or", "not"]);
export const CONSTANT_KEYWORDS = new Set(["nil", "true", "false"]);
export const SPECIAL_CHARS_MAP: Record<string, string> = {
  "\0": "<EOF>",
  "\n": "<newline>",
  "\t": "<tab>",
  " ": "<space>",
  "\r": "<CR>",
};
