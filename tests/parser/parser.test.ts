/* eslint-disable max-nested-callbacks */
/* Imports */
import { Lexer } from "../../src/lexer/lexer.js";
import { Parser } from "../../src/parser/parser.js";
import { Token } from "../../src/lexer/token.js";
import * as ASTNode from "../../src/parser/ast-node/ast-node.js";

/* Helper Functions */
function tokenize(code: string) {
  const lexer = new Lexer(code);
  return lexer.lex();
}
function parse(tokens: Token[]) {
  const parser = new Parser(tokens);
  return parser.parse();
}
function parseExpression(tokens: Token[]) {
  const parser = new Parser(tokens);
  return parser.parseExpression();
}

/* Tests */
describe("Parser", () => {
  describe("Node API", () => {
    describe("ASTNode Creation", () => {
      it("should create a new ASTNode", () => {
        const node = new ASTNode.ASTNode(ASTNode.NodeType.PROGRAM);
        expect(node).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.type).toBe(ASTNode.NodeType.PROGRAM);
        // Non-list nodes have no children field
        expect(node.children).toBeUndefined();
      });

      it("should create a new ASTNodeList", () => {
        const node = new ASTNode.ASTNodeList(ASTNode.NodeType.PROGRAM);
        expect(node).toBeInstanceOf(ASTNode.ASTNodeList);
        expect(node.type).toBe(ASTNode.NodeType.PROGRAM);
        expect(node.children).toEqual([]);
      });

      it("should create a new Program node", () => {
        const node = new ASTNode.Program();
        expect(node).toBeInstanceOf(ASTNode.Program);
        expect(node.type).toBe(ASTNode.NodeType.PROGRAM);
        expect(node.children).toEqual([]);
      });

      it("should create a new Chunk node", () => {
        const node = new ASTNode.Chunk();
        expect(node).toBeInstanceOf(ASTNode.Chunk);
        expect(node.type).toBe(ASTNode.NodeType.CHUNK);
        expect(node.children).toEqual([]);
      });

      it("should create a new ExpressionList node", () => {
        const node = new ASTNode.ExpressionList();
        expect(node).toBeInstanceOf(ASTNode.ExpressionList);
        expect(node.type).toBe(ASTNode.NodeType.EXPRESSION_LIST);
        expect(node.children).toEqual([]);
      });

      it("should error when initializing ASTNode with reserved properties", () => {
        expect(() => {
          new ASTNode.ASTNode(ASTNode.NodeType.PROGRAM, {
            type: ASTNode.NodeType.CHUNK,
          });
        }).toThrow("Property 'type' is reserved and cannot be set on ASTNode.");
      });
    });

    describe("ASTNodeList Children Management", () => {
      it("should correctly set children in ASTNodeList (explicit)", () => {
        const node = new ASTNode.ASTNodeList(ASTNode.NodeType.PROGRAM);
        const childNode = new ASTNode.ASTNode(ASTNode.NodeType.CHUNK);
        node.addChild(childNode);

        expect(node.children).toHaveLength(1);
        expect(node.children[0]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[0]?.type).toBe(ASTNode.NodeType.CHUNK);
      });

      it("should correctly set children in ASTNodeList (implicit)", () => {
        const childNode = new ASTNode.ASTNode(ASTNode.NodeType.CHUNK);
        const node = new ASTNode.ASTNodeList(
          ASTNode.NodeType.PROGRAM,
          undefined,
          [childNode],
        );

        expect(node.children).toHaveLength(1);
        expect(node.children[0]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[0]?.type).toBe(ASTNode.NodeType.CHUNK);
      });

      it("should add multiple children to ASTNodeList", () => {
        const node = new ASTNode.ASTNodeList(ASTNode.NodeType.PROGRAM);
        const childNode1 = new ASTNode.ASTNode(ASTNode.NodeType.CHUNK);
        const childNode2 = new ASTNode.ASTNode(
          ASTNode.NodeType.EXPRESSION_LIST,
        );
        node.addChildren([childNode1, childNode2]);

        expect(node.children).toHaveLength(2);
        expect(node.children[0]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[0]?.type).toBe(ASTNode.NodeType.CHUNK);
        expect(node.children[1]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[1]?.type).toBe(ASTNode.NodeType.EXPRESSION_LIST);
      });

      it("should remove a child from ASTNodeList", () => {
        const node = new ASTNode.ASTNodeList(ASTNode.NodeType.PROGRAM);
        const childNode = new ASTNode.ASTNode(ASTNode.NodeType.CHUNK);
        node.addChild(childNode);
        node.removeChild(childNode);

        expect(node.children).toEqual([]);
      });

      it("should remove multiple children from ASTNodeList", () => {
        const node = new ASTNode.ASTNodeList(ASTNode.NodeType.PROGRAM);
        const childNode1 = new ASTNode.ASTNode(ASTNode.NodeType.CHUNK);
        const childNode2 = new ASTNode.ASTNode(
          ASTNode.NodeType.EXPRESSION_LIST,
        );
        node.addChildren([childNode1, childNode2]);
        node.removeChildren([childNode1, childNode2]);

        expect(node.children).toEqual([]);
      });

      it("should not remove a child that does not exist in ASTNodeList", () => {
        const node = new ASTNode.ASTNodeList(ASTNode.NodeType.PROGRAM);
        const dummyNode = new ASTNode.ASTNode(ASTNode.NodeType.EXPRESSION_LIST);
        expect(() => node.removeChild(dummyNode)).toThrow("Node not found");

        const childNode = new ASTNode.ASTNode(ASTNode.NodeType.CHUNK);
        node.addChild(childNode);
        expect(() => node.removeChild(dummyNode)).toThrow("Node not found");
      });
    });
  });

  describe("Expression Parsing", () => {
    describe("Basic Expressions", () => {
      it("should parse a simple number literal", () => {
        const code = "123";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.NumberLiteral("123");

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should parse a simple string literal", () => {
        const code = '"hello"';
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.StringLiteral("hello");

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should recognize unary operators", () => {
        const code = "-123";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.UnaryOperator(
          "-",
          new ASTNode.NumberLiteral("123"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should be able to nest unary operators", () => {
        const code = "- -123";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.UnaryOperator(
          "-",
          new ASTNode.UnaryOperator("-", new ASTNode.NumberLiteral("123")),
        );

        expect(expressionAST).toEqual(expectedNode);
      });
    });

    describe("Binary Operator Expressions", () => {
      it("should parse a simple addition expression", () => {
        const code = "1 + 2";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.BinaryOperator(
          "+",
          new ASTNode.NumberLiteral("1"),
          new ASTNode.NumberLiteral("2"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should parse a simple subtraction expression", () => {
        const code = "1 - 2";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.BinaryOperator(
          "-",
          new ASTNode.NumberLiteral("1"),
          new ASTNode.NumberLiteral("2"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize multiplication over addition", () => {
        const code = "1 + 2 * 3";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.BinaryOperator(
          "+",
          new ASTNode.NumberLiteral("1"),
          new ASTNode.BinaryOperator(
            "*",
            new ASTNode.NumberLiteral("2"),
            new ASTNode.NumberLiteral("3"),
          ),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize unary operators over binary operators (1)", () => {
        const code = "-1 * 2";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.BinaryOperator(
          "*",
          new ASTNode.UnaryOperator("-", new ASTNode.NumberLiteral("1")),
          new ASTNode.NumberLiteral("2"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize unary operators over binary operators (2)", () => {
        const code = "2 ^ -3";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.BinaryOperator(
          "^",
          new ASTNode.NumberLiteral("2"),
          new ASTNode.UnaryOperator("-", new ASTNode.NumberLiteral("3")),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize binary operators with parentheses (1)", () => {
        const code = "(1 + 2) * 3";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.BinaryOperator(
          "*",
          new ASTNode.BinaryOperator(
            "+",
            new ASTNode.NumberLiteral("1"),
            new ASTNode.NumberLiteral("2"),
          ),
          new ASTNode.NumberLiteral("3"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize binary operators with parentheses (2)", () => {
        const code = "1 * (2 + 3)";
        const tokens = tokenize(code);
        const expressionAST = parseExpression(tokens);
        const expectedNode = new ASTNode.BinaryOperator(
          "*",
          new ASTNode.NumberLiteral("1"),
          new ASTNode.BinaryOperator(
            "+",
            new ASTNode.NumberLiteral("2"),
            new ASTNode.NumberLiteral("3"),
          ),
        );

        expect(expressionAST).toEqual(expectedNode);
      });
    });
  });

  describe("Basic Parsing", () => {
    it("should parse simple local declaration", () => {
      const code = "local a = 1+2";
      const tokens = tokenize(code);
      const ast = parse(tokens);

      const expectedNode = new ASTNode.Program([
        new ASTNode.LocalAssignment(
          ["a"],
          new ASTNode.ExpressionList([
            new ASTNode.BinaryOperator(
              "+",
              new ASTNode.NumberLiteral("1"),
              new ASTNode.NumberLiteral("2"),
            ),
          ]),
        ),
      ]);
      expect(ast).toEqual(expectedNode);
    });

    it("shoud parse simple local declaration with semicolon", () => {
      const code = "local a = 1+2;";
      const tokens = tokenize(code);
      const ast = parse(tokens);

      const expectedNode = new ASTNode.Program([
        new ASTNode.LocalAssignment(
          ["a"],
          new ASTNode.ExpressionList([
            new ASTNode.BinaryOperator(
              "+",
              new ASTNode.NumberLiteral("1"),
              new ASTNode.NumberLiteral("2"),
            ),
          ]),
        ),
      ]);
      expect(ast).toEqual(expectedNode);
    });

    it("should parse simple local declaration with multiple variables", () => {
      const code = "local a, b = 1+2, 2+3";
      const tokens = tokenize(code);
      const ast = parse(tokens);

      const expectedNode = new ASTNode.Program([
        new ASTNode.LocalAssignment(
          ["a", "b"],
          new ASTNode.ExpressionList([
            new ASTNode.BinaryOperator(
              "+",
              new ASTNode.NumberLiteral("1"),
              new ASTNode.NumberLiteral("2"),
            ),
            new ASTNode.BinaryOperator(
              "+",
              new ASTNode.NumberLiteral("2"),
              new ASTNode.NumberLiteral("3"),
            ),
          ]),
        ),
      ]);
      expect(ast).toEqual(expectedNode);
    });
  });
});
