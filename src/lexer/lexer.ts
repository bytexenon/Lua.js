/* Dependencies */
import { makeTrie, TrieNode } from "../utils/utils.js";
import { Token, TokenEnum } from "./token.js";

/* Constants */

// prettier-ignore
const KEYWORDS = new Set([
  "while",    "do",     "end",   "for",
  "local",    "repeat", "until", "return",
  "in",       "if",     "else",  "elseif",
  "function", "then",   "break",
]);
// prettier-ignore
const OPERATORS: readonly string[] = [
  "^", "*", "/", "%",
  "+", "-", "<", ">",
  "#",

  "<=", ">=", "==", "~=",
  "and", "or", "not", ".."
];
// prettier-ignore
const VALID_CHARACTERS = new Set([
  "(", ")",
  "[", "]",
  "{", "}",

  ".", ",",
  ";", ":",
  "="
]) // All the characters expected to be valid

const OPERATOR_TRIE = makeTrie(OPERATORS);
const OPERATOR_KEYWORDS = new Set(["and", "or", "not"]);
const CONSTANT_KEYWORDS = new Set(["nil", "true", "false"]);
const SPECIAL_CHARS_MAP: Record<string, string> = {
  "\0": "<EOF>",
  "\n": "<newline>",
  "\t": "<tab>",
  " ": "<space>",
  "\r": "<CR>",
};

/* Lexer */
export class Lexer {
  private readonly code: string;
  private readonly tokens: Token[];
  private curPos: number;
  private curChar: string;

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
  private checkCharacter(char: string): boolean {
    return this.curChar === char;
  }
  private throwError(message: string): never {
    throw new Error(message);
  }
  private throwUnexpectedCharacterError(expected: string): never {
    const convertedCurChar = SPECIAL_CHARS_MAP[this.curChar] ?? this.curChar;
    this.throwError(
      `Unexpected character '${convertedCurChar}', expected '${expected}'`,
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
  private static isScientificNotationStart(curChar: string): boolean {
    return curChar === "e" || curChar === "E";
  }
  private static isWhitespace(char: string): boolean {
    return char === " " || char === "\t" || char === "\n";
  }

  /* Multi-character checkers */
  private isDelimiter(): boolean {
    const curChar = this.curChar;
    const nextChar = this.peek(1);
    return curChar === "[" && (nextChar === "[" || nextChar === "=");
  }
  private isLongString(): boolean {
    return this.isDelimiter();
  }
  private isComment(): boolean {
    return this.curChar === "-" && this.peek(1) === "-";
  }
  private isHexadecimalStart(): boolean {
    const curChar = this.curChar;
    const nextChar = this.peek(1);
    return curChar === "0" && (nextChar === "x" || nextChar === "X");
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
    let node: TrieNode = OPERATOR_TRIE;
    let operator: string | undefined;

    const curCharPos = this.curPos;
    let index = 0;
    while (true) {
      const char = this.getCharacterFromPosition(curCharPos + index);
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
    let delimeterDepth = 0;
    while (this.curChar === "=") {
      delimeterDepth += 1;
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
        let newDelimeterDepth = 0;
        while (this.curChar === ("=" as string)) {
          newDelimeterDepth += 1;
          this.advance(1);
        }
        if (this.curChar === "]" && newDelimeterDepth === delimeterDepth) {
          break; // Successfully consumed the delimiter
        }
      } else if (this.curChar === "\0") {
        // Error if ended abruptly
        const endingDelimeter = `]${"=".repeat(delimeterDepth)}]`;
        this.throwUnexpectedCharacterError(endingDelimeter);
      }
      this.advance(1);
    }
    this.expectCharacter("]");
    this.advance(1); // Skip the ending "]"
    return this.code.slice(start, this.curPos - 2 - delimeterDepth);
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
      return parseInt(this.code.slice(start, this.curPos), 16);
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

    return parseFloat(this.code.slice(start, this.curPos));
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
      string += this.curChar;
      this.advance(1);
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
    const curChar = this.curChar;
    if (Lexer.isWhitespace(curChar)) {
      this.consumeWhitespace();
    } else if (Lexer.isIdentifierStart(curChar)) {
      const identifier = this.consumeIdentifier();
      if (OPERATOR_KEYWORDS.has(identifier)) {
        this.tokens.push(new Token(TokenEnum.OPERATOR, identifier));
      } else if (CONSTANT_KEYWORDS.has(identifier)) {
        this.tokens.push(new Token(TokenEnum.CONSTANT, identifier));
      } else if (KEYWORDS.has(identifier)) {
        this.tokens.push(new Token(TokenEnum.KEYWORD, identifier));
      } else {
        this.tokens.push(new Token(TokenEnum.IDENTIFIER, identifier));
      }
    } else if (this.isNumberStart()) {
      const number = this.consumeNumber();
      this.tokens.push(new Token(TokenEnum.NUMBER, number.toString()));
    } else if (Lexer.isQuoteString(curChar)) {
      const string = this.consumeSimpleString();
      this.tokens.push(new Token(TokenEnum.STRING, string));
    } else if (this.isLongString()) {
      const string = this.consumeLongString() as string;
      this.tokens.push(new Token(TokenEnum.STRING, string));
    } else if (this.isComment()) {
      this.advance(2); // Skip the first two "-"
      if (this.isDelimiter()) {
        this.consumeLongComment();
      } else {
        this.consumeSimpleComment();
      }
    } else if (this.isVararg()) {
      this.advance(3); // Skip the "..."
      this.tokens.push(new Token(TokenEnum.VARARG, "..."));
    } else {
      const operator = this.consumeOperatorIfPossible();
      if (operator) {
        this.tokens.push(new Token(TokenEnum.OPERATOR, operator));
      } else {
        if (!VALID_CHARACTERS.has(curChar)) {
          throw new Error(`Invalid character: ${curChar}`);
        }
        // Process it as character
        this.tokens.push(new Token(TokenEnum.CHARACTER, curChar));
        this.advance(1); // Skip the character
      }
    }
  }

  /* Main Method */
  public lex(): Token[] {
    while (this.curChar !== "\0") {
      this.getNextToken();
    }
    return this.tokens;
  }
}
