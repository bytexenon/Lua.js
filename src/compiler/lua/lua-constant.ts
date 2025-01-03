/* LuaConstantType */
export const enum LuaConstantType {
  LUA_TNIL = "nil",
  LUA_TBOOLEAN = "boolean",
  LUA_TNUMBER = "number",
  LUA_TSTRING = "string",
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
