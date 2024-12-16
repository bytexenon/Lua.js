/**
 * Enum for token types.
 */
export const enum TokenEnum {
  OPERATOR = "OPERATOR",
  CONSTANT = "CONSTANT",
  KEYWORD = "KEYWORD",
  IDENTIFIER = "IDENTIFIER",
  NUMBER = "NUMBER",
  STRING = "STRING",
  VARARG = "VARARG",
  CHARACTER = "CHARACTER",
}

/**
 * Class representing a token.
 */
export class Token {
  constructor(
    public readonly type: TokenEnum,
    public readonly value: string,
  ) {}
}
