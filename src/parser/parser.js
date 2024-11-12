/* Dependencies */
import * as Node from "./node/node.js";
import { ExpressionParser } from "./expression-parser.js";

/* Constants */

// prettier-ignore
const RECOVERY_KEYWORDS = [
  // Basically, all statement starting keywords
  "while",  "do",     "for",
  "local",  "repeat", "until",
  "return", "if",     "break",
];
const STOP_KEYWORDS = ["end", "else", "elseif"];
const LVALUE_NODE_TYPES = ["Variable", "Index"];

/* Scope */
class Scope {
  constructor(isFunctionScope = false) {
    this.isFunctionScope = isFunctionScope;
    this.variables = {};
  }

  registerVariable(name) {
    this.variables[name] = true;
  }
  hasVariable(name) {
    return this.variables[name] === true;
  }
}

/* Parser */
export class Parser extends ExpressionParser {
  /* Constructor */
  constructor(tokens) {
    super();
    this.tokens = tokens;
    this.position = 0;
    this.curToken = this.tokens[this.position];
    this.ast = new Node.Program();
    this.errors = [];

    /* Scope management */
    this.scopeStack = [];
    this.currentScope = null;

    /* Flow control */
    // Keep track of whether we are in a loop,
    // so we can throw errors if we encounter a break outside of a loop
    this.isInLoop = false;
  }

  /* Utils */
  peek(n) {
    return this.tokens[this.position + n];
  }
  advance(n) {
    const newPos = this.position + n;
    const newToken = this.tokens[newPos];
    this.position = newPos;
    this.curToken = newToken;
  }

  /* Stack operations */
  pushScope(isFunctionScope = false) {
    const newScope = new Scope(isFunctionScope);
    this.scopeStack.push(newScope);
    this.currentScope = newScope;
  }
  popScope() {
    if (this.scopeStack.length === 0) {
      throw new Error("No scope to pop");
    }
    this.scopeStack.pop();
    this.currentScope = this.scopeStack[this.scopeStack.length - 1];
  }

  /* Variable management */
  registerVariable(variableName) {
    if (!this.currentScope) {
      throw new Error("No scope to register variable");
    }
    this.currentScope.registerVariable(variableName);
  }
  registerVariables(variableNames) {
    for (const variableName of variableNames) {
      this.registerVariable(variableName);
    }
  }
  getVariableType(variableName) {
    let isUpvalue = false;
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i];
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
  recover() {
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
  error(token, message) {
    this.errors.push({
      token: token,
      message: message,
      position: token.position,
    });
    throw new Error(`${message}`);
  }

  /* Token checks */
  expectCurrentTokenType(type) {
    if (this.curToken.type !== type) {
      this.error(this.curToken, `Expected token type '${type}'`);
      this.recover();
      return false;
    }
    return true;
  }
  expectCurrentTokenValue(value) {
    if (this.curToken.value !== value) {
      this.error(this.curToken, `Expected token value '${value}'`);
      this.recover();
      return false;
    }
    return true;
  }
  expectCurrentToken(type, value) {
    if (this.expectCurrentTokenType(type)) {
      this.expectCurrentTokenValue(value);
    }
  }
  checkTokenType(token, type) {
    return token?.type === type;
  }
  checkTokenValue(token, value) {
    return token?.value === value;
  }
  checkToken(token, type, value) {
    return (
      this.checkTokenType(token, type) && this.checkTokenValue(token, value)
    );
  }
  checkCurrentTokenType(type) {
    return this.checkTokenType(this.curToken, type);
  }
  checkCurrentTokenValue(value) {
    return this.checkTokenValue(this.curToken, value);
  }
  checkCurrentToken(type, value) {
    return this.checkToken(this.curToken, type, value);
  }

  /* Parser helpers */
  consumeIdentifierList() {
    // Ensure the first token is always an identifier
    this.expectCurrentTokenType("IDENTIFIER");
    const identifiers = [this.curToken.value];
    this.advance(1); // Skip the first identifier

    // Continue consuming identifiers separated by commas
    while (this.checkCurrentToken("CHARACTER", ",")) {
      this.advance(1); // Skip the comma
      this.expectCurrentTokenType("IDENTIFIER");
      identifiers.push(this.curToken.value);
      this.advance(1); // Skip the identifier
    }

    return identifiers;
  }
  parseExpressionList(atLeastOne = false) {
    const expressionList = new Node.ExpressionList();
    while (this.curToken) {
      const expression = this.parseExpression();
      if (!expression) {
        if (atLeastOne && expressionList.children.length === 0) {
          this.error(this.curToken, "Expected at least one expression");
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
  consumeOptionalSemicolon() {
    if (this.checkCurrentToken("CHARACTER", ";")) {
      this.advance(1);
    }
  }
  parseFunctionCall(primaryExpression) {
    this.expectCurrentToken("CHARACTER", "(");
    this.advance(1); // Skip '('
    const args = this.parseExpressionList();
    this.advance(1); // Skip last token of arguments
    this.expectCurrentToken("CHARACTER", ")");
    return new Node.FunctionCall(primaryExpression, args);
  }
  // <exprstat> ::= <functioncall> | <assignment>
  parseExprstat() {
    const expression = this.parsePrefix();
    if (!expression) {
      this.error(this.curToken, "Expected expression");
    }
    if (expression.type === "FunctionCall") {
      // <functioncall>
      return expression;
    }

    // <assignment>
    return this.parseAssignment(expression);
  }
  // <assignment> ::= <lvaluelist> = <explist>
  parseAssignment() {
    const lvalues = this.parseLValueList();
    if (!lvalues) {
      return null;
    }
    this.advance(1); // Skip last token of lvalues
    this.expectCurrentToken("CHARACTER", "=");
    this.advance(1); // Skip '='
    const expressions = this.parseExpressionList();
    return new Node.VariableAssignment(lvalues, expressions);
  }

  /* Keyword parsers */
  parseLocal() {
    this.advance(1); // Skip 'local'
    const locals = this.consumeIdentifierList();
    let expressions;
    // local <varlist> = <explist>
    if (this.checkCurrentToken("CHARACTER", "=")) {
      this.advance(1); // Skip '='
      expressions = this.parseExpressionList();
    }
    this.registerVariables(locals);
    return new Node.LocalStatement(locals, expressions);
  }
  parseWhile() {
    this.advance(1); // Skip `while`
    const condition = this.parseExpression();
    this.advance(1); // Skip last token of condition
    this.expectCurrentToken("KEYWORD", "do");
    this.advance(1); // Skip `do`
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken("KEYWORD", "end");
    return new Node.WhileStatement(condition, chunk);
  }
  parseIf() {
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
  parseDo() {
    this.advance(1); // Skip 'do'
    const chunk = this.parseCodeBlock();
    this.expectCurrentToken("KEYWORD", "end");
    return chunk;
  }

  /* Parser Handler */
  parseStatement() {
    const curToken = this.curToken;
    const tokenType = curToken.type;
    const tokenValue = curToken.value;

    let node;
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
          this.error(curToken, `Unexpected keyword '${tokenValue}'`);
          this.recover();
          break; // TODO: Should we check for optional semicolon?
      }
    } else {
      // <exprstat>
      node = this.parseExprstat();
    }
    this.consumeOptionalSemicolon();

    return node;
  }

  /* Code Block Parser */
  parseCodeBlock(
    isRoot = false,
    isFunctionScope = false,
    scopeVariables = null
  ) {
    const chunk = isRoot ? new Node.Program() : new Node.Chunk();
    this.pushScope(isFunctionScope);
    if (scopeVariables) {
      this.registerVariables(scopeVariables);
    }
    while (this.curToken) {
      const statement = this.parseStatement();
      if (!statement) {
        break; // Break if end of block
      }
      chunk.addChild(statement);
      this.advance(1);
    }
    this.popScope();
    return chunk;
  }

  /* Main */
  parse() {
    const chunk = this.parseCodeBlock(true);
    return chunk;
  }
}
