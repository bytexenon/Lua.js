/* Dependencies */
import { LuaConstant } from "./lua-constant.js";
import { IRInstruction } from "../instructions/ir-instruction.js";

/* LuaPrototypeOptions */
export interface LuaPrototypeOptions {
  code?: IRInstruction[];
  constants?: LuaConstant[];
  prototypes?: LuaPrototype[];
  numberParameters?: number;
  isVararg?: boolean;
  maxStackSize?: number;
}

/* LuaPrototype */
export class LuaPrototype {
  public code: IRInstruction[];
  public constants: LuaConstant[];
  public prototypes: LuaPrototype[];
  public numberParameters: number;
  public isVararg: boolean;
  public maxStackSize: number;

  constructor({
    code = [],
    constants = [],
    prototypes = [],
    numberParameters = 0,
    isVararg = false,
    maxStackSize = 2,
  }: LuaPrototypeOptions = {}) {
    this.code = code;
    this.constants = constants;
    this.prototypes = prototypes;
    this.numberParameters = numberParameters;
    this.isVararg = isVararg;
    this.maxStackSize = maxStackSize;
  }
}
