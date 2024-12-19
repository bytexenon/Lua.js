/* Dependencies */
import { Token, TokenEnum } from "../lexer/token.js";
import * as ASTNode from "./ast-node/ast-node.js";

/* Constants */
// Length of surrounding tokens to show in error messages (in both directions)
const ERROR_SURROUNDING_LENGTH = 10;

// prettier-ignore
const OPERATOR_PRECEDENCE: Readonly<Record<string, readonly [number, number]>> = {
  "+":   [6, 6],  "-":  [6, 6],
  "*":   [7, 7],  "/":  [7, 7],
  "%":   [7, 7],

  "^":   [10, 9], "..": [5, 4],

  "==":  [3, 3],  "~=": [3, 3],
  "<":   [3, 3],  ">":  [3, 3],
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

const UNARY_OPERATORS: readonly string[] = ["-", "not", "#"];
const UNARY_PRECEDENCE = 8;
const STOP_KEYWORDS: readonly string[] = ["end", "else", "elseif", "until"];

/* Scope */
class Scope {
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

/* Parser */
export class Parser {
  private readonly tokens: Token[];
  private readonly scopeStack: Scope[];
  private position: number;
  private curToken: Token | undefined;
  private currentScope: Scope | undefined;
  private readonly keywordParsingMap: Record<
    string,
    () => ASTNode.ASTNode | null
  >;

  /* Constructor */
  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.scopeStack = [];
    this.position = 0;
    this.curToken = this.tokens[this.position];
    this.currentScope = undefined;
    this.keywordParsingMap = {
      local: () => this.parseLocal(),
      while: () => this.parseWhile(),
      if: () => this.parseIf(),
      do: () => this.parseDo(),
      return: () => this.parseReturn(),
      for: () => this.parseFor(),
      break: () => this.parseBreak(),
      repeat: () => this.parseRepeat(),
      function: () => this.parseFunction(),
    };
  }

  /* Utils */
  private peek(n: number): Token | undefined {
    return this.tokens[this.position + n];
  }

  private advance(n: number): void {
    const newPos = this.position + n;
    const newToken = this.tokens[newPos];
    this.position = newPos;
    this.curToken = newToken;
  }

  /* Stack operations */
  private pushScope(isFunctionScope = false): void {
    const newScope = new Scope(isFunctionScope);
    this.scopeStack.push(newScope);
    this.currentScope = newScope;
  }

  private popScope(): void {
    if (this.scopeStack.length === 0) {
      this.fatalError("No scope to pop");
    }
    this.scopeStack.pop();
    this.currentScope = this.scopeStack[this.scopeStack.length - 1];
  }

  /* Variable management */
  private registerVariable(variableName: string): void {
    if (!this.currentScope) {
      this.fatalError("No scope to register variable");
    }
    this.currentScope.registerVariable(variableName);
  }

  private registerVariables(variableNames: string[]): void {
    for (const variableName of variableNames) {
      this.registerVariable(variableName);
    }
  }

  private getVariableType(variableName: string): string {
    let isUpvalue = false;
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope: Scope | undefined = this.scopeStack[i];
      if (!scope) {
        this.fatalError("No scope to check variable type");
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

  /* Error handing */
  private fatalError(message: string): never {
    const minPos = Math.max(0, this.position - ERROR_SURROUNDING_LENGTH);
    const maxPos = Math.min(
      this.tokens.length,
      this.position + ERROR_SURROUNDING_LENGTH,
    );
    const surroundingTokens = this.tokens.slice(minPos, maxPos);
    // eslint-disable-next-line no-console
    console.log(surroundingTokens);
    throw new Error(message);
  }

  /* Token checks */
  private expectCurrentTokenType(type: TokenEnum): boolean {
    if (this.curToken?.type !== type) {
      this.fatalError(`Expected token type '${type.toString()}'`);
    }
    return true;
  }

  private expectCurrentTokenValue(value: string): boolean {
    if (this.curToken?.value !== value) {
      this.fatalError(`Expected token value '${value}'`);
    }
    return true;
  }

  private expectCurrentToken(type: TokenEnum, value: string): void {
    if (this.expectCurrentTokenType(type)) {
      this.expectCurrentTokenValue(value);
    }
  }

  private static checkTokenType(
    token: Token | undefined,
    type: TokenEnum,
  ): boolean {
    return token?.type === type;
  }
  private static checkTokenValue(
    token: Token | undefined,
    value: string,
  ): boolean {
    return token?.value === value;
  }
  private static checkToken(
    token: Token | undefined,
    type: TokenEnum,
    value: string,
  ): boolean {
    return (
      this.checkTokenType(token, type) && this.checkTokenValue(token, value)
    );
  }

  private checkCurrentTokenType(type: TokenEnum): boolean {
    return Parser.checkTokenType(this.curToken, type);
  }

  private checkCurrentTokenValue(value: string): boolean {
    return Parser.checkTokenValue(this.curToken, value);
  }

  private checkCurrentToken(type: TokenEnum, value: string): boolean {
    return Parser.checkToken(this.curToken, type, value);
  }

  /* Expression parsing */
  private static isUnaryOperator(
    token: Token | undefined,
  ): boolean | undefined {
    return (
      token &&
      token.type === TokenEnum.OPERATOR &&
      UNARY_OPERATORS.includes(token.value)
    );
  }

  private static isBinaryOperator(
    token: Token | undefined,
  ): boolean | undefined {
    return (
      token &&
      token.type === TokenEnum.OPERATOR &&
      BINARY_OPERATORS.includes(token.value)
    );
  }

  // It's public because it's used in the tests
  public parseExpression(): ASTNode.ASTNode | null {
    const expression = this.parseBinary();
    if (!expression) {
      this.advance(-1);
      return null; // Error?
    }
    return expression;
  }

  private parseExpressionWithError(
    errorMessage = "Expected expression",
  ): ASTNode.ASTNode {
    const expression = this.parseExpression();
    if (!expression) {
      this.fatalError(errorMessage);
    }
    return expression;
  }

  private parseBase(): ASTNode.ASTNode | null {
    const curToken = this.curToken;
    if (!curToken) {
      return null;
    }

    const tokenType = curToken.type;
    switch (tokenType) {
      case TokenEnum.NUMBER:
        return new ASTNode.NumberLiteral(curToken.value);
      case TokenEnum.STRING:
        return new ASTNode.StringLiteral(curToken.value);
      case TokenEnum.VARARG:
        return new ASTNode.VarargLiteral();
      case TokenEnum.CONSTANT:
        return new ASTNode.ValueLiteral(curToken.value);
      case TokenEnum.IDENTIFIER:
        return this.parseVariable();
      case TokenEnum.CHARACTER: {
        const tokenValue = curToken.value;
        if (tokenValue === "(") {
          // \( <expr> \)
          this.advance(1); // Skip `(`
          const expression = this.parseExpressionWithError();
          this.advance(1); // Skip last token of expression
          this.expectCurrentToken(TokenEnum.CHARACTER, ")");
          return expression;
        } else if (tokenValue === "{") {
          // \{ <fieldlist>? \}
          return this.parseTableConstructor();
        }
        break;
      }
      case TokenEnum.KEYWORD: {
        const tokenValue = curToken.value;
        if (tokenValue === "function") {
          return this.parseAnonymousFunction();
        }
      }
    }

    // It's fine, base doesn't always have to be here
    return null;
  }

  private parseSuffix(
    primaryExpression: ASTNode.ASTNode,
  ): ASTNode.ASTNode | null {
    const nextToken = this.peek(1);
    if (nextToken) {
      if (nextToken.type === TokenEnum.CHARACTER) {
        switch (nextToken.value) {
          case "(": {
            this.advance(1);
            // expression \( <explist> \)
            return this.parseFunctionCall(primaryExpression);
          }
          case ":": {
            this.advance(1);
            // expression : <name> \( <explist> \)
            return this.consumeMethodCall(primaryExpression);
          }
          case ".": {
            this.advance(1);
            // expression \. <name>
            return this.consumeTableIndex(primaryExpression);
          }
          case "[": {
            this.advance(1);
            // expression \[ <expr> \]
            return this.consumeBracketIndex(primaryExpression);
          }
          case "{": {
            this.advance(1);
            // expression \{ <fieldlist>? \}
            return this.parseImplicitFunctionCall(primaryExpression);
          }
        }
      } else if (nextToken.type === TokenEnum.STRING) {
        this.advance(1);
        // <implicitFuncCall> ::= <expression> <string>
        return this.parseImplicitFunctionCall(primaryExpression);
      }
    }
    return null;
  }

  private parsePrefix(): ASTNode.ASTNode | null {
    let primaryExpression = this.parseBase();
    if (!primaryExpression) {
      return null;
    }
    while (true) {
      const suffix = this.parseSuffix(primaryExpression);
      if (!suffix) {
        break;
      }
      primaryExpression = suffix;
    }

    return primaryExpression;
  }

  private parseUnary(): ASTNode.ASTNode | null {
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
    const expression: ASTNode.ASTNode | null =
      this.parseBinary(UNARY_PRECEDENCE);
    if (!expression) {
      this.fatalError("Expected expression");
    }
    return new ASTNode.UnaryOperator(
      operator as ASTNode.UnaryOperatorType,
      expression,
    );
  }

  private parseBinary(minPrecedence = 0): ASTNode.ASTNode | null {
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
        this.fatalError(`Unknown operator '${operator}'`);
      }
      const leftPrecedence = precedence[0];
      const rightPrecedence = precedence[1];
      if (leftPrecedence < minPrecedence) {
        break;
      }
      this.advance(2); // Consume last token of unary and the operator
      const right = this.parseBinary(rightPrecedence);
      if (!right) {
        this.fatalError("Expected expression");
      }

      expression = new ASTNode.BinaryOperator(
        operator as ASTNode.BinaryOperatorType,
        expression,
        right,
      );
    }

    return expression;
  }

  /* Parser helpers */
  private consumeIdentifierList(): string[] {
    // Ensure the first token is always an identifier
    this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
    const identifiers = [this.curToken!.value];
    // this.advance(1); // Skip the first identifier

    // Continue consuming identifiers separated by commas
    while (Parser.checkToken(this.peek(1), TokenEnum.CHARACTER, ",")) {
      this.advance(2); // Skip the last identifier and `,`
      this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
      identifiers.push(this.curToken!.value);
    }

    return identifiers;
  }
  private consumeParameterList(): string[] {
    // <paramlist> ::= \(
    //                    [<identifier>]? [, <identifier>]* [, <vararg>]?
    //                 \)
    this.expectCurrentToken(TokenEnum.CHARACTER, "(");
    this.advance(1); // Skip `(`

    // Check for empty parameter list
    if (this.checkCurrentToken(TokenEnum.CHARACTER, ")")) {
      return [];
    }

    const parameters = [];
    while (this.curToken) {
      if (this.checkCurrentToken(TokenEnum.VARARG, "...")) {
        parameters.push("...");
        this.advance(1); // Skip `...`
        break;
      }
      this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
      parameters.push(this.curToken.value);
      this.advance(1); // Skip the identifier
      if (!this.checkCurrentToken(TokenEnum.CHARACTER, ",")) {
        break;
      }
      this.advance(1); // Skip `,`
    }
    this.expectCurrentToken(TokenEnum.CHARACTER, ")");
    return parameters;
  }

  private parseExpressionList(atLeastOne = false): ASTNode.ExpressionList {
    const expressionList = new ASTNode.ExpressionList();
    const firstExpression = this.parseExpression();
    if (!firstExpression) {
      if (atLeastOne) {
        this.fatalError("Expected at least one expression");
      }
      return expressionList;
    }
    expressionList.addChild(firstExpression);
    while (Parser.checkToken(this.peek(1), TokenEnum.CHARACTER, ",")) {
      this.advance(2); // Skip last token of the expression and `,`
      const expression = this.parseExpressionWithError();
      expressionList.addChild(expression);
    }
    return expressionList;
  }

  private parseVariable(): ASTNode.VariableNode {
    this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
    const variableName = this.curToken!.value;
    const variableType = this.getVariableType(variableName);
    const variableNode =
      (variableType === "Local" && new ASTNode.LocalVariable(variableName)) ||
      (variableType === "Global" && new ASTNode.GlobalVariable(variableName)) ||
      new ASTNode.UpvalueVariable(variableName);
    return variableNode;
  }

  private consumeOptionalSemicolon(): void {
    if (Parser.checkToken(this.peek(1), TokenEnum.CHARACTER, ";")) {
      this.advance(1);
    }
  }

  private parseFunctionCall(
    primaryExpression: ASTNode.ASTNode,
  ): ASTNode.FunctionCall {
    // Check if it's an implicit function call
    if (
      this.checkCurrentTokenType(TokenEnum.STRING) ||
      this.checkCurrentToken(TokenEnum.CHARACTER, "{")
    ) {
      return this.parseImplicitFunctionCall(primaryExpression);
    }

    this.expectCurrentToken(TokenEnum.CHARACTER, "(");
    this.advance(1); // Skip '('
    const args = this.parseExpressionList();
    this.advance(1); // Skip last token of arguments
    this.expectCurrentToken(TokenEnum.CHARACTER, ")");
    return new ASTNode.FunctionCall(primaryExpression, args);
  }

  private consumeMethodCall(
    primaryExpression: ASTNode.ASTNode,
  ): ASTNode.FunctionCall {
    this.advance(1); // Skip ':'
    this.expectCurrentTokenType(TokenEnum.IDENTIFIER); // Method name
    const methodName = this.curToken!.value;
    this.advance(1); // Skip method name
    const methodExpression = new ASTNode.TableIndex(
      primaryExpression,
      new ASTNode.StringLiteral(methodName),
    );
    const methodCall = this.parseFunctionCall(methodExpression);
    methodCall.isMethodCall = true;
    return methodCall;
  }

  private parseImplicitFunctionCall(
    primaryExpression: ASTNode.ASTNode,
  ): ASTNode.FunctionCall {
    const argumentListNode = new ASTNode.ExpressionList();
    if (this.checkCurrentTokenType(TokenEnum.STRING)) {
      const stringNode = new ASTNode.StringLiteral(this.curToken!.value);
      argumentListNode.addChild(stringNode);
    } else {
      this.expectCurrentToken(TokenEnum.CHARACTER, "{");
      const tableNode = this.parseTableConstructor();
      argumentListNode.addChild(tableNode);
    }
    return new ASTNode.FunctionCall(primaryExpression, argumentListNode);
  }

  private parseTableConstructor(): ASTNode.TableConstructor {
    this.expectCurrentToken(TokenEnum.CHARACTER, "{");
    this.advance(1); // Skip '{'
    const fields = new ASTNode.ExpressionList(); // TODO: Make TableElementList node
    let internalImplicitIndex = 1; // Implicit index for table elements that don't have a (explicit) key
    while (!this.checkCurrentToken(TokenEnum.CHARACTER, "}")) {
      // [<key: expression>] = <value: expression>
      if (this.checkCurrentToken(TokenEnum.CHARACTER, "[")) {
        this.advance(1); // Skip `[`
        const key = this.parseExpressionWithError();
        this.advance(1); // Skip last token of key expression
        this.expectCurrentToken(TokenEnum.CHARACTER, "]");
        this.advance(1); // Skip `]`
        this.expectCurrentToken(TokenEnum.CHARACTER, "=");
        this.advance(1); // Skip `=`
        const value = this.parseExpressionWithError();
        fields.addChild(new ASTNode.TableElement(key, value));
      }
      // <key: identifier> = <value: expression>
      else if (
        this.checkCurrentTokenType(TokenEnum.IDENTIFIER) &&
        // To avoid false positives with variables
        Parser.checkToken(this.peek(1), TokenEnum.CHARACTER, "=")
      ) {
        const key = new ASTNode.StringLiteral(this.curToken!.value);
        this.advance(2); // Skip the key and `=`
        const value = this.parseExpressionWithError();
        fields.addChild(new ASTNode.TableElement(key, value));
      }
      // <value: expression>
      else {
        const value = this.parseExpressionWithError();
        const key = new ASTNode.NumberLiteral(internalImplicitIndex.toString());
        internalImplicitIndex += 1;
        fields.addChild(new ASTNode.TableElement(key, value, true));
      }
      this.advance(1); // Skip last token of the value
      if (
        !(
          this.checkCurrentToken(TokenEnum.CHARACTER, ",") ||
          this.checkCurrentToken(TokenEnum.CHARACTER, ";")
        )
      ) {
        break;
      }

      this.advance(1); // Skip `,`
    }
    this.expectCurrentToken(TokenEnum.CHARACTER, "}");
    return new ASTNode.TableConstructor(fields);
  }

  private consumeTableIndex(
    primaryExpression: ASTNode.ASTNode,
  ): ASTNode.TableIndex {
    this.advance(1); // Skip '.'
    this.expectCurrentTokenType(TokenEnum.IDENTIFIER); // Index name
    const indexName = this.curToken!.value;
    return new ASTNode.TableIndex(
      primaryExpression,
      new ASTNode.StringLiteral(indexName),
    );
  }

  private consumeBracketIndex(
    primaryExpression: ASTNode.ASTNode,
  ): ASTNode.ASTNode {
    this.advance(1); // Skip `[`
    const indexExpression = this.parseExpressionWithError();
    this.advance(1); // Skip last token of index expression
    this.expectCurrentToken(TokenEnum.CHARACTER, "]");
    return new ASTNode.TableIndex(primaryExpression, indexExpression);
  }

  // function \( <parlist>? \) <chunk> end
  private parseAnonymousFunction(): ASTNode.AnonymousFunction {
    this.advance(1); // Skip `function`
    this.expectCurrentToken(TokenEnum.CHARACTER, "(");
    const parameters = this.consumeParameterList();
    this.advance(1); // Skip ')'
    const chunk = this.parseCodeBlock(false, true, parameters);
    this.expectCurrentToken(TokenEnum.KEYWORD, "end");
    return new ASTNode.AnonymousFunction(parameters, chunk);
  }

  // <exprstat> ::= <functioncall> | <assignment>
  private parseExprstat(): ASTNode.ASTNode {
    const expression: ASTNode.ASTNode | null = this.parsePrefix();
    if (!expression) {
      this.fatalError("Expected expression");
    }
    if (expression.type === ASTNode.NodeType.FUNCTION_CALL) {
      // <functioncall>
      return expression;
    }
    // <assignment>
    this.advance(1); // Skip last token of lvalue
    return this.parseAssignment(expression);
  }
  private parseAssignment(firstLvalue: ASTNode.ASTNode): ASTNode.ASTNode {
    const lvalues = [firstLvalue];
    while (this.checkCurrentToken(TokenEnum.CHARACTER, ",")) {
      this.advance(1); // Skip `,`
      const nextLvalue = this.parsePrefix();
      if (!nextLvalue) {
        this.fatalError("Expected lvalue");
      }
      lvalues.push(nextLvalue);
      this.advance(1); // Skip last token of lvalue
    }
    this.expectCurrentToken(TokenEnum.CHARACTER, "=");
    this.advance(1); // Skip `=`
    const rvalues = this.parseExpressionList(true);
    return new ASTNode.VariableAssignment(lvalues, rvalues);
  }

  /* Keyword parsers */
  private parseLocal():
    | ASTNode.LocalAssignment
    | ASTNode.LocalFunctionDeclaration {
    this.advance(1); // Skip 'local'
    if (this.checkCurrentToken(TokenEnum.KEYWORD, "function")) {
      // local function <name> \( <parlist> \)
      //   <chunk>
      // end
      this.advance(1); // Skip 'function'
      this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
      const name = this.curToken!.value;
      this.advance(1); // Skip the function name
      const parameters = this.consumeParameterList();
      this.advance(1); // Skip ')'
      const chunk = this.parseCodeBlock(false, true, parameters);
      this.expectCurrentToken(TokenEnum.KEYWORD, "end");
      return new ASTNode.LocalFunctionDeclaration(name, parameters, chunk);
    }
    const locals: string[] = this.consumeIdentifierList();
    let expressions: ASTNode.ExpressionList | undefined;
    // local <varlist> = <explist>
    if (Parser.checkToken(this.peek(1), TokenEnum.CHARACTER, "=")) {
      this.advance(2); // Skip last token of the variable list and `=`
      expressions = this.parseExpressionList(true);
    }
    this.registerVariables(locals);
    return new ASTNode.LocalAssignment(locals, expressions);
  }

  private parseWhile(): ASTNode.WhileStatement | null {
    this.advance(1); // Skip `while`
    const condition = this.parseExpressionWithError();
    this.advance(1); // Skip last token of condition
    this.expectCurrentToken(TokenEnum.KEYWORD, "do");
    this.advance(1); // Skip `do`
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken(TokenEnum.KEYWORD, "end");
    return new ASTNode.WhileStatement(condition, chunk);
  }

  private parseIf(): ASTNode.IfStatement {
    this.advance(1); // Skip `if`
    const mainCondition = this.parseExpressionWithError();
    this.advance(1); // Skip last token of condition
    this.expectCurrentToken(TokenEnum.KEYWORD, "then");
    this.advance(1); // Skip `then`
    const mainChunk = this.parseCodeBlock();
    const ifBranches = new ASTNode.IfBranchList();
    const firstBranch = new ASTNode.IfBranch(mainCondition, mainChunk);
    ifBranches.addChild(firstBranch);
    while (this.checkCurrentTokenType(TokenEnum.KEYWORD)) {
      if (this.checkCurrentTokenValue("elseif")) {
        this.advance(1); // Skip `elseif`
        const condition = this.parseExpressionWithError();
        this.advance(1); // Skip last token of condition
        this.expectCurrentToken(TokenEnum.KEYWORD, "then");
        this.advance(1); // Skip `then`
        const chunk = this.parseCodeBlock();
        ifBranches.addChild(new ASTNode.IfBranch(condition, chunk));
      } else if (this.checkCurrentTokenValue("else")) {
        this.advance(1); // Skip `else`
        const elseChunk = this.parseCodeBlock();
        ifBranches.addChild(new ASTNode.IfBranch(null, elseChunk));
        break;
      } else {
        break; // ???
      }
    }
    this.expectCurrentToken(TokenEnum.KEYWORD, "end");
    return new ASTNode.IfStatement(ifBranches);
  }

  private parseDo(): ASTNode.DoStatement {
    this.advance(1); // Skip 'do'
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken(TokenEnum.KEYWORD, "end");
    return new ASTNode.DoStatement(chunk);
  }

  private parseReturn(): ASTNode.ReturnStatement {
    this.advance(1); // Skip `return`
    const expressions = this.parseExpressionList();
    return new ASTNode.ReturnStatement(expressions);
  }

  private parseFor():
    | ASTNode.GenericForStatement
    | ASTNode.NumericForStatement {
    this.advance(1); // Skip `for`
    // <iterVariable>
    this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
    const firstIteratorVariable = this.curToken!.value;
    this.advance(1); // Skip first iterator variable
    if (this.checkCurrentToken(TokenEnum.CHARACTER, "=")) {
      // NumericForLoop ::= for <iterVar> = <startExpr>, <endExpr>[, <stepExpr>]? do
      //                      <chunk>
      //                    end
      this.advance(1); // Skip `=`
      const startExpression = this.parseExpressionWithError();
      this.advance(1); // Skip last token of the start expression
      this.expectCurrentToken(TokenEnum.CHARACTER, ",");
      this.advance(1); // Skip `,`
      const endExpression = this.parseExpressionWithError();
      this.advance(1); // Skip last token of the end expression
      let stepExpression: ASTNode.ASTNode | null = null;
      if (this.checkCurrentToken(TokenEnum.CHARACTER, ",")) {
        this.advance(1); // Skip `,`
        stepExpression = this.parseExpressionWithError();
        this.advance(1); // Skip last token of the step expression
      }
      this.expectCurrentToken(TokenEnum.KEYWORD, "do");
      this.advance(1); // Skip `do`
      const chunk = this.parseCodeBlock();
      this.expectCurrentToken(TokenEnum.KEYWORD, "end");
      return new ASTNode.NumericForStatement(
        firstIteratorVariable,
        startExpression,
        endExpression,
        stepExpression,
        chunk,
      );
    }

    // <GenericForLoop> ::= for <iterVarList> in <generator> [, <state> [, <control>]? ]? do
    //                        <chunk>
    //                      end

    // <iterVariableList>*
    const iteratorVariables = [firstIteratorVariable];
    while (!this.checkCurrentToken(TokenEnum.KEYWORD, "in")) {
      this.expectCurrentToken(TokenEnum.CHARACTER, ",");
      this.advance(1); // Skip `,`
      this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
      const iteratorVariable = this.curToken!.value;
      iteratorVariables.push(iteratorVariable);
      this.advance(1); // Skip the iterator variable
    }
    this.advance(1); // Skip `in`
    const expressionList = this.parseExpressionList(true);
    // Always assumes that `generator` is a valid expression
    const generator = expressionList.children[0]!;
    const state: ASTNode.ASTNode | undefined = expressionList.children[1];
    const control: ASTNode.ASTNode | undefined = expressionList.children[2];
    this.advance(1); // Skip the last token of the last expression

    this.expectCurrentToken(TokenEnum.KEYWORD, "do");
    this.advance(1);
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken(TokenEnum.KEYWORD, "end");
    return new ASTNode.GenericForStatement(
      iteratorVariables,
      generator,
      state,
      control,
      chunk,
    );
  }

  // Disable eslint because it's one of the keyword parsers
  // eslint-disable-next-line class-methods-use-this
  private parseBreak(): ASTNode.BreakStatement {
    return new ASTNode.BreakStatement();
  }

  private parseRepeat(): ASTNode.RepeatUntilStatement {
    this.advance(1); // Skip `repeat`
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken(TokenEnum.KEYWORD, "until");
    this.advance(1); // Skip `until`
    const condition = this.parseExpressionWithError();
    return new ASTNode.RepeatUntilStatement(chunk, condition);
  }

  private parseFunction(): ASTNode.FunctionDeclaration {
    // <FunctionDeclaration> ::= function <variable>[. <funcField>]* \( <parlist>? \)
    //                             <chunk>
    //                           end
    // <MethodDeclaration> ::= function <variable>[. <funcField>]* : <funcField> \( <parlist>? \)
    //                           <chunk>
    //                         end
    this.advance(1); // Skip `function`
    // Mandatory variable
    const variableNode = this.parseVariable();
    this.advance(1); // Skip the variable
    const fields = [];
    while (this.checkCurrentToken(TokenEnum.CHARACTER, ".")) {
      this.advance(1); // Skip `.`
      this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
      const newField = this.curToken!.value;
      fields.push(newField);
      this.advance(1); // Skip the new field
    }
    let isMethod = false;
    if (this.checkCurrentToken(TokenEnum.CHARACTER, ":")) {
      this.advance(1); // Skip `:`
      this.expectCurrentTokenType(TokenEnum.IDENTIFIER);
      const newField = this.curToken!.value;
      fields.push(newField);
      isMethod = true;
      this.advance(1); // Skip the new field
    }
    this.expectCurrentToken(TokenEnum.CHARACTER, "(");
    const parameters = this.consumeParameterList();
    this.advance(1); // Skip ')'
    const chunk = this.parseCodeBlock(false, true, parameters);
    this.expectCurrentToken(TokenEnum.KEYWORD, "end");
    return new ASTNode.FunctionDeclaration(
      variableNode,
      fields,
      parameters,
      chunk,
      isMethod,
    );
  }

  /* Parser Handler */
  private parseStatement(): ASTNode.ASTNode | null {
    const curToken = this.curToken!;
    const tokenType = curToken.type;
    const tokenValue = curToken.value;

    let node: ASTNode.ASTNode | null = null;
    if (tokenType === TokenEnum.KEYWORD) {
      if (STOP_KEYWORDS.includes(tokenValue)) {
        return null;
      }
      const keywordParser = this.keywordParsingMap[tokenValue];
      if (!keywordParser) {
        this.fatalError(`Unknown keyword '${tokenValue}'`);
      }

      node = keywordParser();
    } else {
      // <exprstat>
      node = this.parseExprstat();
    }
    this.consumeOptionalSemicolon();

    return node;
  }

  /* Code Block Parser */
  private parseCodeBlock(
    isRoot = false,
    isFunctionScope = false,
    scopeVariables: string[] | null = null,
  ): ASTNode.Program | ASTNode.Chunk {
    const chunk = isRoot ? new ASTNode.Program() : new ASTNode.Chunk();
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
  public parse(): ASTNode.Program {
    const chunk = this.parseCodeBlock(true);
    if (this.curToken) {
      this.fatalError("Expected end of file");
    }

    return chunk;
  }
}
