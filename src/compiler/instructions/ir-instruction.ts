/* Dependencies */
import { IROperand } from "./ir-operand.js";
import { Opcodes } from "./opcodes.js";

/* IRInstruction */
export class IRInstruction {
  /* Example:
  MOVE R0, R1 ; Two registers
  LOADK R0, K0 ; Register and constant
  ADD R0, K0, K1 ; Register (dest) and two constants
  CLOSURE R0, P0 ; Register and prototype
  JMP OFFSET-10 ; Jump with offset (relative)
  */
  constructor(
    public opcode: Opcodes,
    public operands: IROperand[],
  ) {}
}
