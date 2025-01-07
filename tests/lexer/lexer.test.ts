/* Imports */
import * as Token from "../../src/lexer/token.js";
import { Lexer } from "../../src/lexer/lexer.js";
import {
  KEYWORDS,
  OPERATORS,
  VALID_CHARACTERS,
  CONSTANT_KEYWORDS,
} from "../../src/lexer/constants.js";

/* Constants */
const WHITESPACE = " \t\n";
const TEST_IDENTIFIERS = [
  "variableName",
  "ANOTHERVARIABLE",
  "_underscore1234567890",
  "a",
];
const TEST_NUMBERS = [
  "123",
  "123456.789",
  "0xBEEF",
  "0Xbeeef",
  "1e10",
  "2.5e-3",
  ".9e9",
];

/* Helper Functions */
function testLexer(code: string, expectedTokens: Token.Token[]): void {
  const lexer = new Lexer(code);
  const tokens = lexer.lex();
  expect(tokens).toEqual(expectedTokens);
}

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
          new Token.IdentifierToken("a"),
          new Token.IdentifierToken("b"),
        ]);
      }
    });
  });

  describe("Keyword Tokenization", () => {
    it("should tokenize keywords", () => {
      const keywords = Array.from(KEYWORDS);
      testLexer(
        keywords.join(" "),
        keywords.map((value) => new Token.KeywordToken(value)),
      );
    });
  });

  describe("Constant Tokenization", () => {
    it("should tokenize constants", () => {
      const constants = Array.from(CONSTANT_KEYWORDS);
      testLexer(
        constants.join(" "),
        constants.map((value) => new Token.ConstantToken(value)),
      );
    });
  });

  describe("Operator Tokenization", () => {
    it("should tokenize operators", () => {
      testLexer(
        OPERATORS.join(" "),
        OPERATORS.map((value) => new Token.OperatorToken(value)),
      );
    });
  });

  describe("Valid Character Tokenization", () => {
    it("should tokenize valid characters", () => {
      const validCharacters = Array.from(VALID_CHARACTERS);
      testLexer(
        validCharacters.join(""),
        validCharacters.map((value) => new Token.CharacterToken(value)),
      );
    });
  });

  describe("Identifier Tokenization", () => {
    it("should tokenize identifiers", () => {
      testLexer(
        TEST_IDENTIFIERS.join(" "),
        TEST_IDENTIFIERS.map((value) => new Token.IdentifierToken(value)),
      );
    });
  });

  describe("Number Tokenization", () => {
    it("should tokenize numbers", () => {
      const expectedTokens = TEST_NUMBERS.map(
        (num) => new Token.NumberToken(Number(num).toString()),
      );
      testLexer(TEST_NUMBERS.join(" "), expectedTokens);
    });
  });

  describe("String Tokenization", () => {
    it("should tokenize strings", () => {
      testLexer("'simple string' \"another string\"", [
        new Token.StringToken("simple string"),
        new Token.StringToken("another string"),
      ]);
    });

    it("should tokenize long strings", () => {
      testLexer("[[long string]]", [new Token.StringToken("long string")]);
    });

    it("should tokenize long strings with delimiters", () => {
      testLexer("[=[long string]=]", [new Token.StringToken("long string")]);
      testLexer("[==[long string]==]", [new Token.StringToken("long string")]);
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
        testLexer('"hello\\nworld"', [new Token.StringToken("hello\nworld")]);
      });

      it("should handle tab escape sequence", () => {
        testLexer('"hello\\tworld"', [new Token.StringToken("hello\tworld")]);
      });

      it("should handle carriage return escape sequence", () => {
        testLexer('"hello\\rworld"', [new Token.StringToken("hello\rworld")]);
      });

      it("should error on invalid escape sequence", () => {
        const lexer = new Lexer('"hello\\xworld"');
        expect(() => lexer.lex()).toThrow("Invalid escape sequence: \\x");
      });
    });

    describe("should handle numeric escape sequences", () => {
      it("should handle 1-char escape digit", () => {
        testLexer('"hello\\9world"', [new Token.StringToken("hello\tworld")]);
      });

      it("should handle 2-char escape digit", () => {
        testLexer('"hello\\97world"', [new Token.StringToken("helloaworld")]);
      });

      it("should handle 3-char escape digit", () => {
        testLexer('"hello\\122world"', [new Token.StringToken("hellozworld")]);
      });
    });
  });

  describe("Comment Tokenization", () => {
    it("should tokenize simple comments", () => {
      testLexer("--simple comment", []);
    });

    it("should not skip a character after simple comment", () => {
      testLexer("--simple comment\nhello", [
        new Token.IdentifierToken("hello"),
      ]);
    });

    it("should tokenize long comments", () => {
      testLexer("--[[long comment]]", []);
    });

    it("should not skip a character after long comment", () => {
      testLexer("--[[long comment]]hello", [
        new Token.IdentifierToken("hello"),
      ]);
    });

    it("should tokenize long comments with delimiters", () => {
      testLexer("--[=[long comment]=]", []);
      testLexer("--[==[long comment]==]", []);
    });

    it("should handle malformed long comment delimiters", () => {
      testLexer("--[==simple comment\nhello", [
        new Token.IdentifierToken("hello"),
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
      testLexer("...", [new Token.VarargToken()]);
    });
  });

  describe("Error Handling", () => {
    it("should throw error on invalid character", () => {
      const lexer = new Lexer("@");
      expect(() => lexer.lex()).toThrow("Invalid character: @");
    });
  });
});
