/* IRInstruction */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class IRInstruction {
  /* Example:
  MOVE R0, R1 ; Two registers
  LOADK R0, K0 ; Register and constant
  ADD R0, K0, K1 ; Register (dest) and two constants
  CLOSURE R0, P0 ; Register and prototype
  JMP OFFSET-10 ; Jump with offset (relative)
  */

  public opcode: string;
  public operands: IROperand[];

  constructor(opcode: string, operands: IROperand[]) {
    this.opcode = opcode;
    this.operands = operands;
  }
}
class IROperand {
  public type: string;
  public value: number;

  constructor(type: string, value: number) {
    this.type = type;
    this.value = value;
  }
}
