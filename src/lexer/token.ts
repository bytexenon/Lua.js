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
export abstract class Token {
  constructor(
    public readonly type: TokenEnum,
    public readonly value: string,
  ) {}
}

export class OperatorToken extends Token {
  constructor(value: string) {
    super(TokenEnum.OPERATOR, value);
  }
}

export class ConstantToken extends Token {
  constructor(value: string) {
    super(TokenEnum.CONSTANT, value);
  }
}

export class KeywordToken extends Token {
  constructor(value: string) {
    super(TokenEnum.KEYWORD, value);
  }
}

export class IdentifierToken extends Token {
  constructor(value: string) {
    super(TokenEnum.IDENTIFIER, value);
  }
}

export class NumberToken extends Token {
  constructor(value: string) {
    super(TokenEnum.NUMBER, value);
  }
}

export class StringToken extends Token {
  constructor(value: string) {
    super(TokenEnum.STRING, value);
  }
}

export class VarargToken extends Token {
  constructor() {
    super(TokenEnum.VARARG, "...");
  }
}

export class CharacterToken extends Token {
  constructor(value: string) {
    super(TokenEnum.CHARACTER, value);
  }
}
