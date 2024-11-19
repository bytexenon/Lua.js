/* Dependencies */
import { ASTNode } from "../parser/ast-node";

/* Opcodes */
// prettier-ignore
const enum Opcodes {
  MOVE,      LOADK,    LOADBOOL,  LOADNIL,  GETUPVAL,
  GETGLOBAL, GETTABLE, SETGLOBAL, SETUPVAL, SETTABLE,
  NEWTABLE,  SELF,     ADD,       SUB,      MUL,
  DIV,       MOD,      POW,       UNM,      NOT,
  LEN,       CONCAT,   JMP,       EQ,       LT,
  LE,        TEST,     TESTSET,   CALL,     TAILCALL,
  RETURN,    FORLOOP,  FORPREP,   TFORLOOP, SETLIST,
  CLOSE,     CLOSURE,  VARARG
}

/* IRInstruction */
class IRInstruction {
  /* Example:
  MOVE R0, R1 ; Two registers
  LOADK R0, K0 ; Register and constant
  ADD R0, K0, K1 ; Register (dest) and two constants
  CLOSURE R0, P0 ; Register and prototype
  JMP OFFSET-10 ; Jump with offset (relative)
  */
  public opcode: Opcodes;
  public operands: IROperand[];

  constructor(opcode: Opcodes, operands: IROperand[]) {
    this.opcode = opcode;
    this.operands = operands;
  }
}

/* IROperand */
class IROperand {
  public type: string;
  public value: number;

  constructor(type: string, value: number) {
    this.type = type;
    this.value = value;
  }
}

/* LuaConstantType */
const enum LuaConstantType {
  LUA_TNIL = 0,
  LUA_TBOOLEAN = 1,
  LUA_TNUMBER = 3,
  LUA_TSTRING = 4,
}

/* LuaConstant */
class LuaConstant {
  public type: LuaConstantType;
  public value: number | string | boolean;

  constructor(type: LuaConstantType, value: number | string | boolean) {
    this.type = type;
    this.value = value;
  }
}

/* LuaPrototype */
export class LuaPrototype {
  public code: IRInstruction[];
  public constants: LuaConstant[];
  public prototypes: LuaPrototype[];
  public numParams: number;
  public isVararg: boolean;
  public maxStackSize: number;

  constructor(
    code: IRInstruction[] = [],
    constants: LuaConstant[] = [],
    prototypes: LuaPrototype[] = [],
    numParams = 0,
    isVararg = false,
    // registers 0/1 are always valid for _ENV and vararg
    maxStackSize = 2,
  ) {
    this.code = code;
    this.constants = constants;
    this.prototypes = prototypes;
    this.numParams = numParams;
    this.isVararg = isVararg;
    this.maxStackSize = maxStackSize;
  }
}

/* Compiler */
export class Compiler {
  private currentProto: LuaPrototype;
  private currentChunk: ASTNode;
  private nextRegister: number; // next free register
  private numVars: number; // number of active variables

  /* Constructor */
  constructor(ast: ASTNode) {
    this.currentProto = new LuaPrototype([]);
    this.currentChunk = ast;
    this.nextRegister = 0;
    this.numVars = 0;
  }

  /* Stack Management */
  private allocateRegister(): number {
    // eslint-disable-next-line no-plusplus
    return this.nextRegister++;
  }
  private freeRegister(): void {
    // eslint-disable-next-line no-plusplus
    this.nextRegister--;
  }
  private freeRegisters(n: number): void {
    this.nextRegister -= n;
  }
}
