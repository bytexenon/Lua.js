/* LuaScope */
export class LuaScope {
  constructor(
    public readonly isFunctionScope = false,
    // variable name to register mapping
    public locals: Record<string, number> = {},
  ) {}
}
