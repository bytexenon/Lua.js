/* eslint-disable max-nested-callbacks */

/* Imports */
import { Lexer } from "../../src/lexer/lexer.js";
import { Token, TokenEnum } from "../../src/lexer/token";

/* Constants */
const WHITESPACE = " \t\n";
const CONSTANTS = ["nil", "true", "false"];
// prettier-ignore
const KEYWORDS = [
  "while", "do", "end", "for",
  "local", "repeat", "until", "return",
  "in", "if", "else", "elseif",
  "function", "then", "break",
];
// prettier-ignore
const OPERATORS = [
  "^", "*", "/", "%",
  "+", "-", "<", ">",
  "#", "<=", ">=", "==", "~=",
  "and", "or", "not", ".."
];
// prettier-ignore
const VALID_CHARACTERS = [
  "(", ")", "[", "]", "{", "}",
  ".", ",", ";", ":", "="
];
// prettier-ignore
const TEST_IDENTIFIERS = [
  "variableName", "ANOTHERVARIABLE", "_underscore1234567890", "a"
];
// prettier-ignore
const TEST_NUMBERS = [
  "123", "123456.789", "0xBEEF", "0Xbeeef", "1e10", "2.5e-3", ".9e9"
];

/* Helper Functions */
const createTokens = (values: string[], type: TokenEnum) =>
  values.map((value) => new Token(type, value));

const testLexer = (code: string, expectedTokens: Token[]) => {
  const lexer = new Lexer(code);
  const tokens = lexer.lex();
  expect(tokens).toEqual(expectedTokens);
};

/* Tests */
describe("Lexer", () => {
  describe("Whitespace Handling", () => {
    it("should ignore singular and multiple whitespaces", () => {
      for (const ws1 of WHITESPACE) {
        testLexer(ws1, []);
        for (const ws2 of WHITESPACE) {
          testLexer(`${ws1}${ws2}`, []);
        }
      }
    });

    it("should ignore whitespace between tokens", () => {
      for (const ws of WHITESPACE) {
        testLexer(`a${ws}b`, [
          new Token(TokenEnum.IDENTIFIER, "a"),
          new Token(TokenEnum.IDENTIFIER, "b"),
        ]);
      }
    });
  });

  describe("Keyword Tokenization", () => {
    it("should tokenize keywords", () => {
      testLexer(KEYWORDS.join(" "), createTokens(KEYWORDS, TokenEnum.KEYWORD));
    });
  });

  describe("Constant Tokenization", () => {
    it("should tokenize constants", () => {
      testLexer(
        CONSTANTS.join(" "),
        createTokens(CONSTANTS, TokenEnum.CONSTANT),
      );
    });
  });

  describe("Operator Tokenization", () => {
    it("should tokenize operators", () => {
      testLexer(
        OPERATORS.join(" "),
        createTokens(OPERATORS, TokenEnum.OPERATOR),
      );
    });
  });

  describe("Valid Character Tokenization", () => {
    it("should tokenize valid characters", () => {
      testLexer(
        VALID_CHARACTERS.join(""),
        createTokens(VALID_CHARACTERS, TokenEnum.CHARACTER),
      );
    });
  });

  describe("Identifier Tokenization", () => {
    it("should tokenize identifiers", () => {
      testLexer(
        TEST_IDENTIFIERS.join(" "),
        createTokens(TEST_IDENTIFIERS, TokenEnum.IDENTIFIER),
      );
    });
  });

  describe("Number Tokenization", () => {
    it("should tokenize numbers", () => {
      const expectedTokens = TEST_NUMBERS.map(
        (num) => new Token(TokenEnum.NUMBER, Number(num).toString()),
      );
      testLexer(TEST_NUMBERS.join(" "), expectedTokens);
    });
  });

  describe("String Tokenization", () => {
    it("should tokenize strings", () => {
      testLexer("'simple string' \"another string\"", [
        new Token(TokenEnum.STRING, "simple string"),
        new Token(TokenEnum.STRING, "another string"),
      ]);
    });

    it("should tokenize long strings", () => {
      testLexer("[[long string]]", [
        new Token(TokenEnum.STRING, "long string"),
      ]);
    });

    it("should tokenize long strings with delimiters", () => {
      testLexer("[=[long string]=]", [
        new Token(TokenEnum.STRING, "long string"),
      ]);
      testLexer("[==[long string]==]", [
        new Token(TokenEnum.STRING, "long string"),
      ]);
    });

    it("should throw error on unterminated long string", () => {
      const lexer = new Lexer("[=[invalid long string]");
      expect(() => lexer.lex()).toThrow(
        "Unexpected character '<EOF>', expected ']=]'",
      );
    });

    it("should throw error on malformed long string with spaces", () => {
      const lexer = new Lexer("[===== this string lacks a bracket]=====]");
      expect(() => lexer.lex()).toThrow(
        "Unexpected character '<space>', expected '['",
      );
    });

    it("should throw error on malformed long string with exclamation mark", () => {
      const lexer = new Lexer("[=====!this string lacks a bracket]=====]");
      expect(() => lexer.lex()).toThrow(
        "Unexpected character '!', expected '['",
      );
    });

    describe("should handle escape sequences", () => {
      it("should handle newline escape sequence", () => {
        testLexer('"hello\\nworld"', [
          new Token(TokenEnum.STRING, "hello\nworld"),
        ]);
      });

      it("should handle tab escape sequence", () => {
        testLexer('"hello\\tworld"', [
          new Token(TokenEnum.STRING, "hello\tworld"),
        ]);
      });

      it("should handle carriage return escape sequence", () => {
        testLexer('"hello\\rworld"', [
          new Token(TokenEnum.STRING, "hello\rworld"),
        ]);
      });

      it("should error on invalid escape sequence", () => {
        const lexer = new Lexer('"hello\\xworld"');
        expect(() => lexer.lex()).toThrow("Invalid escape sequence: \\x");
      });
    });

    describe("should handle numeric escape sequences", () => {
      it("should handle 1-char escape digit", () => {
        testLexer('"hello\\9world"', [
          new Token(TokenEnum.STRING, "hello\tworld"),
        ]);
      });

      it("should handle 2-char escape digit", () => {
        testLexer('"hello\\97world"', [
          new Token(TokenEnum.STRING, "helloaworld"),
        ]);
      });

      it("should handle 3-char escape digit", () => {
        testLexer('"hello\\122world"', [
          new Token(TokenEnum.STRING, "hellozworld"),
        ]);
      });
    });
  });

  describe("Comment Tokenization", () => {
    it("should tokenize simple comments", () => {
      testLexer("--simple comment", []);
    });

    it("should not skip a character after simple comment", () => {
      testLexer("--simple comment\nhello", [
        new Token(TokenEnum.IDENTIFIER, "hello"),
      ]);
    });

    it("should tokenize long comments", () => {
      testLexer("--[[long comment]]", []);
    });

    it("should not skip a character after long comment", () => {
      testLexer("--[[long comment]]hello", [
        new Token(TokenEnum.IDENTIFIER, "hello"),
      ]);
    });

    it("should tokenize long comments with delimiters", () => {
      testLexer("--[=[long comment]=]", []);
      testLexer("--[==[long comment]==]", []);
    });

    it("should handle malformed long comment delimiters", () => {
      testLexer("--[==simple comment\nhello", [
        new Token(TokenEnum.IDENTIFIER, "hello"),
      ]);
    });

    it("should throw error on unterminated long comment", () => {
      const lexer = new Lexer("--[=[invalid long comment]");
      expect(() => lexer.lex()).toThrow(
        "Unexpected character '<EOF>', expected ']=]'",
      );
    });
  });

  describe("Vararg Tokenization", () => {
    it("should tokenize vararg", () => {
      testLexer("...", [new Token(TokenEnum.VARARG, "...")]);
    });
  });

  describe("Error Handling", () => {
    it("should throw error on invalid character", () => {
      const lexer = new Lexer("@");
      expect(() => lexer.lex()).toThrow("Invalid character: @");
    });
  });
});
