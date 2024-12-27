/* IROperandType */
export const enum IROperandType {
  REGISTER = "Register",
  CONSTANT = "Constant",
}

/* IROperandValue */
export type IROperandValue = number;

/* IROperand */
export class IROperand {
  constructor(
    public type: IROperandType,
    public value: IROperandValue,
  ) {}
}
