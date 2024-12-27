/* Scope */
export class Scope {
  constructor(
    public readonly isFunctionScope = false,
    // variable name to register mapping
    public locals: Record<string, number> = {},
  ) {}
}
