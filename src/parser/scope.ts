/* Scope */
export class Scope {
  public readonly isFunctionScope: boolean;
  public variables: Record<string, boolean>;

  constructor(isFunctionScope = false) {
    this.isFunctionScope = isFunctionScope;
    this.variables = {};
  }

  public registerVariable(name: string): void {
    this.variables[name] = true;
  }

  public hasVariable(name: string): boolean {
    return this.variables[name] === true;
  }
}
