/* IROperandType */
export const enum IROperandType {
  REGISTER = "Register", // Register index
  CONSTANT = "Constant", // Constant index
  UPVALUE = "Upvalue", // Upvalue index
  PROTOTYPE = "Prototype", // Prototype index (used only in OP_CLOSURE)

  OTHER = "Other", // Other operand type (OP_JMP offset, OP_TEST flag, etc.)
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
