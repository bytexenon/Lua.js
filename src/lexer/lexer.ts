/* Dependencies */
import {
  CONSTANT_KEYWORDS,
  KEYWORDS,
  OPERATOR_KEYWORDS,
  OPERATOR_TRIE,
  SPECIAL_CHARS_MAP,
  TOKENIZER_ESCAPED_CHARACTER_CONVERSIONS,
  VALID_CHARACTERS,
} from "./constants.js";
import * as Token from "./token.js";
import { TrieNode } from "../utils/utils.js";

/* Lexer */
export class Lexer {
  /* Properties */
  private readonly code: string;
  private readonly tokens: Token.Token[];
  private curPos: number;
  private curChar: string;

  /* Properties for constants */
  public CONSTANT_KEYWORDS = CONSTANT_KEYWORDS;
  public KEYWORDS = KEYWORDS;
  public OPERATOR_KEYWORDS = OPERATOR_KEYWORDS;
  public OPERATOR_TRIE = OPERATOR_TRIE;
  public SPECIAL_CHARS_MAP = SPECIAL_CHARS_MAP;
  public TOKENIZER_ESCAPED_CHARACTER_CONVERSIONS =
    TOKENIZER_ESCAPED_CHARACTER_CONVERSIONS;
  public VALID_CHARACTERS = VALID_CHARACTERS;

  /* Constructor */
  constructor(code: string) {
    this.code = code;
    this.tokens = [];
    this.curPos = 0;
    this.curChar = this.getCharacterFromPosition(this.curPos);
  }

  /* Utils */
  private getCharacterFromPosition(n: number): string {
    return this.code[n] ?? "\0";
  }
  private peek(n: number): string {
    return this.getCharacterFromPosition(this.curPos + n);
  }
  private advance(n: number): void {
    const newPos = this.curPos + n;
    const newChar = this.getCharacterFromPosition(newPos);
    this.curPos = newPos;
    this.curChar = newChar;
  }

  /* Error Handling */
  private static throwError(message: string): never {
    throw new Error(message);
  }
  private checkCharacter(char: string): boolean {
    return this.curChar === char;
  }
  private throwUnexpectedCharacterError(expected: string): never {
    const convertedCurrentChar =
      this.SPECIAL_CHARS_MAP[this.curChar] ?? this.curChar;
    Lexer.throwError(
      `Unexpected character '${convertedCurrentChar}', expected '${expected}'`,
    );
  }
  private expectCharacter(char: string): never | void {
    if (!this.checkCharacter(char)) {
      this.throwUnexpectedCharacterError(char);
    }
  }

  /* Single-character checkers */
  private static isQuoteString(char: string): boolean {
    return char === "'" || char === '"';
  }
  private static isIdentifierStart(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 97 && code <= 122) || // a-z
      (code >= 65 && code <= 90) || // A-Z
      code === 95 // _
    );
  }
  private static isIdentifier(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 97 && code <= 122) || // a-z
      (code >= 65 && code <= 90) || // A-Z
      (code >= 48 && code <= 57) || // 0-9
      code === 95 // _
    );
  }
  private static isNumber(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57;
  }
  private static isHexNumber(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 48 && code <= 57) || // 0-9
      (code >= 97 && code <= 102) || // a-f
      (code >= 65 && code <= 70) // A-F
    );
  }
  private static isScientificNotationStart(currentChar: string): boolean {
    return currentChar === "e" || currentChar === "E";
  }
  private static isWhitespace(char: string): boolean {
    return char === " " || char === "\t" || char === "\n";
  }

  /* Multi-character checkers */
  private isDelimiter(): boolean {
    const currentChar = this.curChar;
    const nextChar = this.peek(1);
    return currentChar === "[" && (nextChar === "[" || nextChar === "=");
  }
  private isLongString(): boolean {
    return this.isDelimiter();
  }
  private isComment(): boolean {
    return this.curChar === "-" && this.peek(1) === "-";
  }
  private isHexadecimalStart(): boolean {
    const currentChar = this.curChar;
    const nextChar = this.peek(1);
    return currentChar === "0" && (nextChar === "x" || nextChar === "X");
  }
  private isVararg(): boolean {
    return this.curChar === "." && this.peek(1) === "." && this.peek(2) === ".";
  }
  private isNumberStart(): boolean {
    return (
      Lexer.isNumber(this.curChar) ||
      (this.curChar === "." && Lexer.isNumber(this.peek(1)))
    );
  }

  /* Consumers */

  // Checks if the next character sequence is an operator,
  // if so, consumes it and returns the operator string.
  private consumeOperatorIfPossible(): string | false {
    let node: TrieNode = this.OPERATOR_TRIE;
    let operator: string | undefined;

    const currentCharPos = this.curPos;
    let index = 0;
    while (true) {
      const char = this.getCharacterFromPosition(currentCharPos + index);
      node = node[char] as TrieNode;
      if (!node) {
        break;
      }
      operator = node["word"] as string;
      index += 1;
    }
    if (!operator) {
      return false;
    }
    this.advance(index);
    return operator;
  }
  private consumeDelimiter(noExpect = false): string | false {
    this.advance(1); // Skip the first "["
    let delimiterDepth = 0;
    while (this.curChar === "=") {
      delimiterDepth += 1;
      this.advance(1);
    }
    if (!noExpect) {
      this.expectCharacter("[");
    } else if (!this.checkCharacter("[")) {
      return false;
    }

    this.expectCharacter("[");
    this.advance(1); // Skip the second "["
    const start = this.curPos;
    while (true) {
      if (this.curChar === "]") {
        this.advance(1);
        let newDelimiterDepth = 0;
        while (this.curChar === ("=" as string)) {
          newDelimiterDepth += 1;
          this.advance(1);
        }
        if (this.curChar === "]" && newDelimiterDepth === delimiterDepth) {
          break; // Successfully consumed the delimiter
        }
      } else if (this.curChar === "\0") {
        // Error if ended abruptly
        const equalSigns = "=".repeat(delimiterDepth);
        const endingDelimiter = `]${equalSigns}]`;
        this.throwUnexpectedCharacterError(endingDelimiter);
      }

      // Skip the character
      this.advance(1);
    }
    this.expectCharacter("]");
    this.advance(1); // Skip the ending "]"
    return this.code.slice(start, this.curPos - 2 - delimiterDepth);
  }
  private consumeWhitespace(): void {
    while (Lexer.isWhitespace(this.peek(1))) {
      this.advance(1);
    }
    this.advance(1);
  }
  private consumeDigit(): void {
    while (Lexer.isNumber(this.peek(1))) {
      this.advance(1);
    }
    this.advance(1);
  }
  private consumeNumber(): number {
    const start = this.curPos;

    // Hexadecimal number
    if (this.isHexadecimalStart()) {
      this.advance(2); // Skip the "0x"
      while (Lexer.isHexNumber(this.peek(1))) {
        this.advance(1);
      }
      this.advance(1);
      return Number.parseInt(this.code.slice(start, this.curPos), 16);
    }

    // The normal part
    this.consumeDigit();

    // Floating point number
    if (this.curChar === ".") {
      this.advance(1); // Skip the "."
      this.consumeDigit();
    }

    // Scientific notation
    if (Lexer.isScientificNotationStart(this.curChar)) {
      this.advance(1); // Skip the "e" or "E"
      if (this.curChar === "-" || this.curChar === "+") {
        this.advance(1); // Skip the "-" or "+"
      }
      this.consumeDigit();
    }

    return Number.parseFloat(this.code.slice(start, this.curPos));
  }
  private consumeIdentifier(): string {
    const start = this.curPos;
    while (Lexer.isIdentifier(this.peek(1))) {
      this.advance(1);
    }
    this.advance(1);
    return this.code.slice(start, this.curPos);
  }

  private consumeSimpleString(): string {
    const quote = this.curChar;
    this.advance(1); // Skip the quote
    let string = "";
    while (this.curChar && this.curChar !== quote) {
      if (this.curChar === "\\") {
        this.advance(1); // Skip the "\"
        const escapedChar =
          this.TOKENIZER_ESCAPED_CHARACTER_CONVERSIONS[this.curChar];
        if (escapedChar) {
          string += escapedChar;
          this.advance(1); // Skip the escaped character
        } else if (Lexer.isNumber(this.curChar)) {
          // \d\d\d type of escape
          let numericEscape = "";
          for (
            let index = 0;
            index < 3 && Lexer.isNumber(this.curChar);
            index++
          ) {
            numericEscape += this.curChar;
            this.advance(1);
          }
          string += String.fromCharCode(Number.parseInt(numericEscape, 10));
        } else {
          Lexer.throwError(`Invalid escape sequence: \\${this.curChar}`);
        }
      } else {
        string += this.curChar;
        this.advance(1);
      }
    }
    this.advance(1); // Skip the ending quote
    return string;
  }
  private consumeLongString(): string | false {
    return this.consumeDelimiter();
  }

  private consumeSimpleComment(): void {
    while (this.curChar !== "\n" && this.curChar !== "\0") {
      this.advance(1);
    }
  }
  private consumeLongComment(): void {
    if (!this.consumeDelimiter(true)) {
      // Treat it as a simple comment
      this.consumeSimpleComment();
    }
  }

  /* Main Consumer */
  private getNextToken(): void {
    const currentChar = this.curChar;
    if (Lexer.isWhitespace(currentChar)) {
      this.consumeWhitespace();
    } else if (Lexer.isIdentifierStart(currentChar)) {
      const identifier = this.consumeIdentifier();
      if (this.OPERATOR_KEYWORDS.has(identifier)) {
        this.tokens.push(new Token.OperatorToken(identifier));
      } else if (this.CONSTANT_KEYWORDS.has(identifier)) {
        this.tokens.push(new Token.ConstantToken(identifier));
      } else if (this.KEYWORDS.has(identifier)) {
        this.tokens.push(new Token.KeywordToken(identifier));
      } else {
        this.tokens.push(new Token.IdentifierToken(identifier));
      }
    } else if (this.isNumberStart()) {
      const number = this.consumeNumber();
      this.tokens.push(new Token.NumberToken(number.toString()));
    } else if (Lexer.isQuoteString(currentChar)) {
      const string = this.consumeSimpleString();
      this.tokens.push(new Token.StringToken(string));
    } else if (this.isLongString()) {
      const string = this.consumeLongString() as string;
      this.tokens.push(new Token.StringToken(string));
    } else if (this.isComment()) {
      this.advance(2); // Skip the first two "-"
      if (this.isDelimiter()) {
        this.consumeLongComment();
      } else {
        this.consumeSimpleComment();
      }
    } else if (this.isVararg()) {
      this.advance(3); // Skip the "..."
      this.tokens.push(new Token.VarargToken());
    } else {
      const operator = this.consumeOperatorIfPossible();
      if (operator) {
        this.tokens.push(new Token.OperatorToken(operator));
      } else {
        if (!this.VALID_CHARACTERS.has(currentChar)) {
          Lexer.throwError(`Invalid character: ${currentChar}`);
        }
        // Process it as character
        this.tokens.push(new Token.CharacterToken(currentChar));
        this.advance(1); // Skip the character
      }
    }
  }

  /* Main Method */
  public lex(): Token.Token[] {
    while (this.curChar !== "\0") {
      this.getNextToken();
    }
    return this.tokens;
  }
}
