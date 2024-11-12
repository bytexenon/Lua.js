/* Dependencies */
import * as Node from "./node/node.js";

/* Constants */

// prettier-ignore
const OPERATOR_PRECEDENCE = {
  "+":   [6, 6],  "-":  [6, 6],
  "*":   [7, 7],  "/":  [7, 7], "%": [7, 7],
  "^":   [10, 9], "..": [5, 4],
  "==":  [3, 3],  "~=": [3, 3], "<": [3, 3], ">": [3, 3],
  "<=":  [3, 3],  ">=": [3, 3],
  "and": [2, 2],  "or": [1, 1],
};
// prettier-ignore
const BINARY_OPERATORS = [
  "+",  "-",   "*",  "/",
  "%",  "^",   "..", "==",
  "~=", "<",   ">",  "<=",
  ">=", "and", "or"
];
const UNARY_OPERATORS = ["-", "not", "#"];
const UNARY_PRECEDENCE = 8;

/* ExpressionParser */
export class ExpressionParser {
  static isUnaryOperator(token) {
    return (
      token &&
      token.type === "OPERATOR" &&
      UNARY_OPERATORS.includes(token.value)
    );
  }
  static isBinaryOperator(token) {
    return (
      token &&
      token.type === "OPERATOR" &&
      BINARY_OPERATORS.includes(token.value)
    );
  }

  parseExpression() {
    const expression = this.parseBinary();
    if (!expression) {
      this.advance(-1);
      return null; // Error?
    }
    return expression;
  }

  parseBase() {
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
  parseSuffix(primaryExpression) {
    const nextToken = this.peek(1);
    if (!nextToken) {
      // TODO: Should error?
      return null;
    }
    const nextTokenValue = nextToken.value;
    const nextTokenType = nextToken.type;
    if (nextTokenType === "CHARACTER") {
      switch (nextTokenValue) {
        // <functionCall> ::= <expression> \( <args> \)
        case "(":
          this.advance(1);
          return this.parseFunctionCall(primaryExpression, false);
        // <tableAccess> ::= <expression> \[ <expression> \]
        case "[":
          this.advance(1);
          return this.parseTableAccess(primaryExpression, false);
        // <tableAccess> ::= <expression> \. <identifier>
        case ".":
          this.advance(1);
          return this.parseTableAccess(primaryExpression, true);
        // <functionCall> ::= <expression> : <identifier> \( <args> \)
        case ":":
          this.advance(1);
          return this.parseMethodCall(primaryExpression, true);
      }
    }

    return null;
  }
  parsePrefix() {
    let primaryExpression = this.parseBase();
    if (!primaryExpression) {
      // TODO: Should error?
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
  parseUnary() {
    const curToken = this.curToken;
    if (!curToken) {
      // TODO: Should error?
      return null;
    }
    if (!ExpressionParser.isUnaryOperator(curToken)) {
      return this.parsePrefix();
    }
    const operator = curToken.value;

    this.advance(1);
    const expression = this.parseBinary(UNARY_PRECEDENCE);
    return new Node.UnaryOperator(operator, expression);
  }
  parseBinary(minPrecedence = 0) {
    let expression = this.parseUnary();
    if (!expression) {
      // TODO: Should error?
      return null;
    }

    while (true) {
      const nextToken = this.peek(1);
      if (!ExpressionParser.isBinaryOperator(nextToken)) {
        break;
      }
      const operator = nextToken.value;
      const precedence = OPERATOR_PRECEDENCE[operator];
      if (precedence[0] < minPrecedence) {
        break;
      }

      this.advance(2); // Consume last token of unary and the operator
      const right = this.parseBinary(precedence[1]);
      if (!right) {
        this.error(this.curToken, "Expected expression");
        // How can we recover from this?
        this.recover();
        return null; // It doesn't break from all parsers
      }

      expression = new Node.BinaryOperator(operator, expression, right);
    }

    return expression;
  }
}
