/* IRInstruction */
class IRInstruction {
  constructor(opcode, operands) {
    this.opcode = opcode;
    this.operands = operands;
  }
}
class IROperand {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

/* Example:

  MOVE R0, R1 ; Two registers
  LOADK R0, K0 ; Register and constant
  LOADK R0, K0, K1 ; Register (dest) and two constants
  CLOSURE R0, P0 ; Register and prototype
  JMP OFFSET-10 ; Jump with offset (relative)

*/
