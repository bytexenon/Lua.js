/* LuaConstantType */
export const enum LuaConstantType {
  LUA_TNIL = 0,
  LUA_TBOOLEAN = 1,
  LUA_TNUMBER = 3,
  LUA_TSTRING = 4,
}

/* LuaConstantValue */
export type LuaConstantValue = number | string | boolean;

/* LuaConstant */
export class LuaConstant {
  constructor(
    public type: LuaConstantType,
    public value: LuaConstantValue,
  ) {}
}
