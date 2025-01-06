/**
 * Enum for token types.
 * This enum defines the various types of tokens that can be encountered
 * during the lexical analysis of the source code.
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
 * Abstract class representing a token.
 * This serves as the base class for all specific token types.
 */
export abstract class Token {
  /**
   * Creates an instance of a Token.
   * @param type The type of the token, as defined in TokenEnum.
   * @param value The value of the token, typically a string representation.
   */
  constructor(
    public readonly type: TokenEnum,
    public readonly value: string,
  ) {}
}

/**
 * Class representing an operator token.
 * This class is used for tokens that are Lua operators, such as +, -, *, etc.
 */
export class OperatorToken extends Token {
  /**
   * Creates an instance of an OperatorToken.
   * @param value The value of the operator token, e.g., "+", "-", "*".
   */
  constructor(value: string) {
    super(TokenEnum.OPERATOR, value);
  }
}

/**
 * Class representing a constant token.
 * This class is used for tokens that are constants: nil, true, false.
 */
export class ConstantToken extends Token {
  /**
   * Creates an instance of a ConstantToken.
   * @param value The value of the constant token, can only be "nil", "true", or "false".
   */
  constructor(value: string) {
    super(TokenEnum.CONSTANT, value);
  }
}

/**
 * Class representing a keyword token.
 * This class is used for tokens that are language keywords, such as if, else, while, etc.
 */
export class KeywordToken extends Token {
  /**
   * Creates an instance of a KeywordToken.
   * @param value The value of the keyword token, e.g., "if", "else".
   */
  constructor(value: string) {
    super(TokenEnum.KEYWORD, value);
  }
}

/**
 * Class representing an identifier token.
 * This class is used for tokens that are identifiers, such as variable names, function names, etc.
 */
export class IdentifierToken extends Token {
  /**
   * Creates an instance of an IdentifierToken.
   * @param value The value of the identifier token, e.g., "variableName".
   */
  constructor(value: string) {
    super(TokenEnum.IDENTIFIER, value);
  }
}

/**
 * Class representing a number token.
 * This class is used for tokens that are numeric literals, such as integers or floating-point numbers.
 */
export class NumberToken extends Token {
  /**
   * Creates an instance of a NumberToken.
   * @param value The value of the number token, e.g., "123", "3.14".
   */
  constructor(value: string) {
    super(TokenEnum.NUMBER, value);
  }
}

/**
 * Class representing a string token.
 * This class is used for tokens that are string literals, includes both quoted and multiline strings.
 */
export class StringToken extends Token {
  /**
   * Creates an instance of a StringToken.
   * @param value The value of the string token, e.g., '"hello"', '[[multiline string]]'.
   */
  constructor(value: string) {
    super(TokenEnum.STRING, value);
  }
}

/**
 * Class representing a vararg token.
 * This class is used for tokens that represent the vararg (...) operator.
 */
export class VarargToken extends Token {
  /**
   * Creates an instance of a VarargToken.
   * The value is always "...".
   */
  constructor() {
    super(TokenEnum.VARARG, "...");
  }
}

/**
 * Class representing a character token.
 * This class is used for tokens that are individual characters that are not recognized as other token types.
 */
export class CharacterToken extends Token {
  /**
   * Creates an instance of a CharacterToken.
   * @param value The value of the character token, e.g., "=", "(", ")".
   */
  constructor(value: string) {
    super(TokenEnum.CHARACTER, value);
  }
}
