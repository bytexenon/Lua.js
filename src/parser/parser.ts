/* Dependencies */
import * as Node from "./node/node.js";

/* Constants */

// prettier-ignore
const OPERATOR_PRECEDENCE: Readonly<Record<string, readonly [number, number]>> = {
  "+":   [6, 6],  "-":  [6, 6],
  "*":   [7, 7],  "/":  [7, 7], "%": [7, 7],
  "^":   [10, 9], "..": [5, 4],
  "==":  [3, 3],  "~=": [3, 3], "<": [3, 3], ">": [3, 3],
  "<=":  [3, 3],  ">=": [3, 3],
  "and": [2, 2],  "or": [1, 1],
};
// prettier-ignore
const BINARY_OPERATORS: readonly string[] = [
  "+",  "-",   "*",  "/",
  "%",  "^",   "..", "==",
  "~=", "<",   ">",  "<=",
  ">=", "and", "or"
];
// prettier-ignore
const RECOVERY_KEYWORDS: readonly string[] = [
  // Basically, all statement starting keywords
  "while",  "do",     "for",
  "local",  "repeat", "until",
  "return", "if",     "break",
];

const UNARY_OPERATORS: readonly string[] = ["-", "not", "#"];
const UNARY_PRECEDENCE = 8;
const STOP_KEYWORDS: readonly string[] = ["end", "else", "elseif"];

/* Token type */
interface Token {
  type: string;
  value: string;
}

/* Scope */
class Scope {
  isFunctionScope: boolean;
  variables: Record<string, boolean>;

  constructor(isFunctionScope = false) {
    this.isFunctionScope = isFunctionScope;
    this.variables = {};
  }

  registerVariable(name: string): void {
    this.variables[name] = true;
  }

  hasVariable(name: string): boolean {
    return this.variables[name] === true;
  }
}

/* Parser */
export class Parser {
  tokens: Token[];
  position: number;
  curToken: Token | undefined;
  ast: Node.Program;
  errors: { token: Token; message: string; position: number }[];
  scopeStack: Scope[];
  currentScope: Scope | undefined;
  isInLoop: boolean;

  /* Constructor */
  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.position = 0;
    this.curToken = this.tokens[this.position];
    this.ast = new Node.Program();
    this.errors = [];

    /* Scope management */
    this.scopeStack = [];
    this.currentScope = undefined;

    /* Flow control */
    // Keep track of whether we are in a loop,
    // so we can throw errors if we encounter a break outside of a loop
    this.isInLoop = false;
  }

  /* Utils */
  peek(n: number): Token | undefined {
    return this.tokens[this.position + n];
  }

  advance(n: number): void {
    const newPos = this.position + n;
    const newToken = this.tokens[newPos];
    this.position = newPos;
    this.curToken = newToken;
  }

  /* Stack operations */
  pushScope(isFunctionScope = false): void {
    const newScope = new Scope(isFunctionScope);
    this.scopeStack.push(newScope);
    this.currentScope = newScope;
  }

  popScope(): void {
    if (this.scopeStack.length === 0) {
      throw new Error("No scope to pop");
    }
    this.scopeStack.pop();
    this.currentScope = this.scopeStack[this.scopeStack.length - 1];
  }

  /* Variable management */
  registerVariable(variableName: string): void {
    if (!this.currentScope) {
      throw new Error("No scope to register variable");
    }
    this.currentScope.registerVariable(variableName);
  }

  registerVariables(variableNames: string[]): void {
    for (const variableName of variableNames) {
      this.registerVariable(variableName);
    }
  }

  getVariableType(variableName: string): string {
    let isUpvalue = false;
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope: Scope | undefined = this.scopeStack[i];
      if (!scope) {
        throw new Error("Invalid scope");
      }

      if (scope.hasVariable(variableName)) {
        return isUpvalue ? "Upvalue" : "Local";
      }
      if (scope.isFunctionScope) {
        isUpvalue = true;
      }
    }
    return "Global";
  }

  /* Error handing and recovery */
  recover(): void {
    // Tries to recover from a syntax error by skipping
    // tokens until a "safe" token is found
    while (this.curToken) {
      if (this.checkCurrentTokenType("KEYWORD")) {
        if (RECOVERY_KEYWORDS.includes(this.curToken.value)) {
          return;
        }
      }
      this.advance(1);
    }
  }

  error(message: string): void {
    throw new Error(message);
  }

  /* Token checks */
  expectCurrentTokenType(type: string): boolean {
    if (this.curToken?.type !== type) {
      this.error(`Expected token type '${type}'`);
      this.recover();
      return false;
    }
    return true;
  }

  expectCurrentTokenValue(value: string): boolean {
    if (this.curToken?.value !== value) {
      this.error(`Expected token value '${value}'`);
      this.recover();
      return false;
    }
    return true;
  }

  expectCurrentToken(type: string, value: string): void {
    if (this.expectCurrentTokenType(type)) {
      this.expectCurrentTokenValue(value);
    }
  }

  checkTokenType(token: Token | undefined, type: string): boolean {
    return token?.type === type;
  }

  checkTokenValue(token: Token | undefined, value: string): boolean {
    return token?.value === value;
  }

  checkToken(token: Token | undefined, type: string, value: string): boolean {
    return (
      this.checkTokenType(token, type) && this.checkTokenValue(token, value)
    );
  }

  checkCurrentTokenType(type: string): boolean {
    return this.checkTokenType(this.curToken, type);
  }

  checkCurrentTokenValue(value: string): boolean {
    return this.checkTokenValue(this.curToken, value);
  }

  checkCurrentToken(type: string, value: string): boolean {
    return this.checkToken(this.curToken, type, value);
  }

  /* Expression parsing */
  static isUnaryOperator(token: Token | undefined): boolean | undefined {
    return (
      token &&
      token.type === "OPERATOR" &&
      UNARY_OPERATORS.includes(token.value)
    );
  }

  static isBinaryOperator(token: Token | undefined): boolean | undefined {
    return (
      token &&
      token.type === "OPERATOR" &&
      BINARY_OPERATORS.includes(token.value)
    );
  }

  parseExpression(): Node.Node | null {
    const expression = this.parseBinary();
    if (!expression) {
      this.advance(-1);
      return null; // Error?
    }
    return expression;
  }

  parseBase(): Node.Node | null {
    const curToken = this.curToken;
    if (!curToken) {
      return null;
    }

    const tokenType = curToken.type;
    switch (tokenType) {
      case "NUMBER":
        return new Node.NumberLiteral(curToken.value);
      case "STRING":
        return new Node.StringLiteral(curToken.value);
      case "VARARG":
        return new Node.VarargLiteral();
      case "IDENTIFIER": {
        const variableName = curToken.value;
        const variableType = this.getVariableType(variableName);
        if (variableType === "Local") {
          return new Node.LocalVariable(variableName);
        } else if (variableType === "Global") {
          return new Node.GlobalVariable(variableName);
        }
        return new Node.UpvalueVariable(variableName);
      }
    }

    // It's fine, base doesn't always have to be here
    return null;
  }

  parseSuffix(): Node.Node | null {
    const nextToken = this.peek(1);
    if (!nextToken) {
      // TODO: Should error?
      return null;
    }
    return null;
  }

  parsePrefix(): Node.Node | null {
    let primaryExpression = this.parseBase();
    if (!primaryExpression) {
      // TODO: Should error?
      return null;
    }
    while (true) {
      const suffix = this.parseSuffix();
      if (!suffix) {
        break;
      }
      primaryExpression = suffix;
    }

    return primaryExpression;
  }

  parseUnary(): Node.Node | null {
    const curToken = this.curToken;
    if (!curToken) {
      // TODO: Should error?
      return null;
    }
    if (!Parser.isUnaryOperator(curToken)) {
      return this.parsePrefix();
    }
    const operator = curToken.value;

    this.advance(1);
    const expression: Node.Node | null = this.parseBinary(UNARY_PRECEDENCE);
    if (!expression) {
      this.error("Expected expression");
      return null;
    }
    return new Node.UnaryOperator(operator, expression);
  }

  parseBinary(minPrecedence = 0): Node.Node | null {
    let expression = this.parseUnary();
    if (!expression) {
      // TODO: Should error?
      return null;
    }

    while (true) {
      const nextToken: Token | undefined = this.peek(1);
      if (!Parser.isBinaryOperator(nextToken)) {
        break;
      }
      // @ts-expect-error - Parser.isBinaryOperator checks whether nextToken is null
      const operator: string = nextToken.value;
      const precedence = OPERATOR_PRECEDENCE[operator];
      if (!precedence) {
        this.error(`Unknown operator '${operator}'`);
        return null;
      }
      const leftPrecedence = precedence[0];
      const rightPrecedence = precedence[1];
      if (leftPrecedence < minPrecedence) {
        break;
      }
      this.advance(2); // Consume last token of unary and the operator
      const right = this.parseBinary(rightPrecedence);
      if (!right) {
        this.error("Expected expression");
        // How can we recover from this?
        this.recover();
        return null; // It doesn't break from all parsers
      }

      expression = new Node.BinaryOperator(operator, expression, right);
    }

    return expression;
  }

  /* Parser helpers */
  consumeIdentifierList(): string[] {
    // Ensure the first token is always an identifier
    this.expectCurrentTokenType("IDENTIFIER");
    const identifiers = [this.curToken!.value];
    this.advance(1); // Skip the first identifier

    // Continue consuming identifiers separated by commas
    while (this.checkCurrentToken("CHARACTER", ",")) {
      this.advance(1); // Skip the comma
      this.expectCurrentTokenType("IDENTIFIER");
      identifiers.push(this.curToken!.value);
      this.advance(1); // Skip the identifier
    }

    return identifiers;
  }

  parseExpressionList(atLeastOne = false): Node.ExpressionList {
    const expressionList = new Node.ExpressionList();
    while (this.curToken) {
      const expression = this.parseExpression();
      if (!expression) {
        if (atLeastOne && expressionList.children.length === 0) {
          this.error("Expected at least one expression");
        }
        break;
      }
      expressionList.addChild(expression);
      if (this.checkToken(this.peek(1), "CHARACTER", ",")) {
        this.advance(2); // Skip the last token of the expression and the comma
      } else {
        break;
      }
    }
    return expressionList;
  }

  consumeOptionalSemicolon(): void {
    if (this.checkToken(this.peek(1), "CHARACTER", ";")) {
      this.advance(1);
    }
  }

  /*parseFunctionCall(
    primaryExpression: Node.Node
  ): Node.FunctionCall {
    this.expectCurrentToken("CHARACTER", "(");
    this.advance(1); // Skip '('
    const args = this.parseExpressionList();
    this.advance(1); // Skip last token of arguments
    this.expectCurrentToken("CHARACTER", ")");
    return new Node.FunctionCall(primaryExpression, args);
  }*/

  // <exprstat> ::= <functioncall> | <assignment>
  /* parseExprstat(): Node.Node | null {
    const expression: Node.Node | null = this.parsePrefix();
    if (!expression) {
      this.error("Expected expression");
      return null;
    }
    if (expression.type === "FunctionCall") {
      // <functioncall>
      return expression;
    }

    // <assignment>
    return this.parseAssignment(expression);
  } */

  // <assignment> ::= <lvaluelist> = <explist>
  /*parseAssignment(firstLvalue: Node.Node): Node.VariableAssignment | null {
    const lvalues = this.parseLValueList();
    if (!lvalues) {
      return null;
    }
    this.advance(1); // Skip last token of lvalues
    this.expectCurrentToken("CHARACTER", "=");
    this.advance(1); // Skip '='
    const expressions = this.parseExpressionList();
    return new VariableAssignment(lvalues, expressions);
  }*/

  /* Keyword parsers */
  parseLocal(): Node.LocalStatement {
    this.advance(1); // Skip 'local'
    const locals: string[] = this.consumeIdentifierList();
    let expressions: Node.ExpressionList | undefined;
    // local <varlist> = <explist>
    if (this.checkCurrentToken("CHARACTER", "=")) {
      this.advance(1); // Skip '='
      expressions = this.parseExpressionList();
    }
    this.registerVariables(locals);
    return new Node.LocalStatement(locals, expressions);
  }

  parseWhile(): Node.WhileStatement | null {
    this.advance(1); // Skip `while`
    const condition: Node.Node | null = this.parseExpression();
    if (!condition) {
      this.error("Expected expression");
      return null;
    }
    this.advance(1); // Skip last token of condition
    this.expectCurrentToken("KEYWORD", "do");
    this.advance(1); // Skip `do`
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken("KEYWORD", "end");
    return new Node.WhileStatement(condition, chunk);
  }

  parseIf(): Node.IfStatement {
    this.advance(1); // Skip `if`
    const mainCondition = this.parseExpression();
    this.advance(1); // Skip last token of condition
    this.expectCurrentToken("KEYWORD", "then");
    this.advance(1); // Skip `then`
    const mainChunk = this.parseCodeBlock();
    const ifBranches = new Node.IfBranchList();
    const firstBranch = new Node.IfBranch(mainCondition, mainChunk);
    ifBranches.addChild(firstBranch);
    while (this.checkCurrentTokenType("KEYWORD")) {
      if (this.checkCurrentTokenValue("elseif")) {
        this.advance(1); // Skip `elseif`
        const condition = this.parseExpression();
        this.advance(1); // Skip last token of condition
        this.expectCurrentToken("KEYWORD", "then");
        this.advance(1); // Skip `then`
        const chunk = this.parseCodeBlock();
        ifBranches.addChild(new Node.IfBranch(condition, chunk));
      } else if (this.checkCurrentTokenValue("else")) {
        this.advance(1); // Skip `else`
        const elseChunk = this.parseCodeBlock();
        ifBranches.addChild(new Node.IfBranch(null, elseChunk));
        break;
      } else {
        break; // ???
      }
    }
    this.expectCurrentToken("KEYWORD", "end");
    return new Node.IfStatement(ifBranches);
  }

  parseDo(): Node.Chunk {
    this.advance(1); // Skip 'do'
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken("KEYWORD", "end");
    return chunk;
  }

  /* Parser Handler */
  parseStatement(): Node.Node | null {
    const curToken = this.curToken;
    if (!curToken) {
      return null;
    }
    const tokenType = curToken.type;
    const tokenValue = curToken.value;

    let node: Node.Node | null = null;
    if (tokenType === "KEYWORD") {
      if (STOP_KEYWORDS.includes(tokenValue)) {
        return null;
      }

      switch (tokenValue) {
        case "local":
          node = this.parseLocal();
          break;
        case "while":
          node = this.parseWhile();
          break;
        case "if":
          node = this.parseIf();
          break;
        case "do":
          node = this.parseDo();
          break;
        default:
          this.error(`Unexpected keyword '${tokenValue}'`);
          this.recover();
          break; // TODO: Should we check for optional semicolon?
      }
    } /* else {
      // <exprstat>
      node = this.parseExprstat();
    } */
    this.consumeOptionalSemicolon();

    return node;
  }

  /* Code Block Parser */
  parseCodeBlock(
    isRoot = false,
    isFunctionScope = false,
    scopeVariables: string[] | null = null,
  ): Node.Program | Node.Chunk {
    const chunk = isRoot ? new Node.Program() : new Node.Chunk();
    this.pushScope(isFunctionScope);
    if (scopeVariables) {
      this.registerVariables(scopeVariables);
    }
    while (this.curToken) {
      const statement = this.parseStatement();
      if (!statement) {
        // Break if end of chunk
        break;
      }
      chunk.addChild(statement);
      this.advance(1);
    }
    this.popScope();
    return chunk;
  }

  /* Main */
  parse(): Node.Program {
    const chunk = this.parseCodeBlock(true);
    return chunk;
  }
}
