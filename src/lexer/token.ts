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
  OPERATOR,
  CONSTANT,
  KEYWORD,
  IDENTIFIER,
  NUMBER,
  STRING,
  VARARG,
  CHARACTER,
}
