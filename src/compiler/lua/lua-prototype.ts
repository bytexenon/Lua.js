/* Dependencies */
import { IRInstruction } from "../instructions/ir-instruction.js";
import { LuaConstant } from "./lua-constant.js";

/* LuaPrototype */
export class LuaPrototype {
  constructor(
    public code: IRInstruction[] = [],
    public constants: LuaConstant[] = [],
    public prototypes: LuaPrototype[] = [],
    public numberParameters = 0,
    public isVararg = false,
    // registers 0/1 are always valid
    public maxStackSize = 2,
  ) {}
}
