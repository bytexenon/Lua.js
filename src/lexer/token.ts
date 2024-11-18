/* Token */
export class Token {
  public type: TokenEnum;
  public value: string;

  constructor(type: TokenEnum, value: string) {
    this.type = type;
    this.value = value;
  }
}

/* TokenInterface */
export interface TokenInterface {
  readonly type: TokenEnum;
  readonly value: string;
}

/* TokenEnum */
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
