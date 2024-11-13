/* Token */
export class Token {
  type: TokenEnum;
  value: string;

  constructor(type: TokenEnum, value: string) {
    this.type = type;
    this.value = value;
  }
}

/* TokenInterface */
export interface TokenInterface {
  type: TokenEnum;
  value: string;
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
