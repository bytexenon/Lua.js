/* Imports */
import { Lexer } from "../../src/lexer/lexer.js";
import { Parser } from "../../src/parser/parser.js";
import * as ASTNode from "../../src/parser/ast-node/ast-node.js";

/* Helper Functions */
function tokenize(code: string) {
  const lexer = new Lexer(code);
  return lexer.lex();
}
function parse(code: string) {
  const tokens = tokenize(code);
  const parser = new Parser(tokens);
  return parser.parse();
}
function parseExpression(code: string) {
  const tokens = tokenize(code);
  const parser = new Parser(tokens);
  return parser.parseExpression();
}

/* Tests */
describe("Parser", () => {
  describe("Node API", () => {
    describe("ASTNode Creation", () => {
      it("should create a new ASTNode", () => {
        const node = new ASTNode.Program();
        expect(node).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.type).toBe(ASTNode.NodeType.PROGRAM);
      });

      it("should create a new ASTNodeList", () => {
        const node = new ASTNode.Program();
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
    });

    describe("Child Management", () => {
      it("should correctly set children in ASTNodeList (explicit)", () => {
        const node = new ASTNode.Program();
        const childNode = new ASTNode.Chunk();
        node.addChild(childNode);

        expect(node.children).toHaveLength(1);
        expect(node.children[0]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[0]?.type).toBe(ASTNode.NodeType.CHUNK);
      });

      it("should correctly set children in ASTNodeList (implicit)", () => {
        const childNode = new ASTNode.Chunk();
        const node = new ASTNode.Program([childNode]);

        expect(node.children).toHaveLength(1);
        expect(node.children[0]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[0]?.type).toBe(ASTNode.NodeType.CHUNK);
      });

      it("should add multiple children to ASTNodeList", () => {
        const node = new ASTNode.Program();
        const childNode1 = new ASTNode.Chunk();
        const childNode2 = new ASTNode.ExpressionList();
        node.addChildren([childNode1, childNode2]);

        expect(node.children).toHaveLength(2);
        expect(node.children[0]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[0]?.type).toBe(ASTNode.NodeType.CHUNK);
        expect(node.children[1]).toBeInstanceOf(ASTNode.ASTNode);
        expect(node.children[1]?.type).toBe(ASTNode.NodeType.EXPRESSION_LIST);
      });

      it("should remove a child from ASTNodeList", () => {
        const node = new ASTNode.Program();
        const childNode = new ASTNode.Chunk();
        node.addChild(childNode);
        node.removeChild(childNode);

        expect(node.children).toEqual([]);
      });

      it("should remove multiple children from ASTNodeList", () => {
        const node = new ASTNode.Program();
        const childNode1 = new ASTNode.Chunk();
        const childNode2 = new ASTNode.ExpressionList();
        node.addChildren([childNode1, childNode2]);
        node.removeChildren([childNode1, childNode2]);

        expect(node.children).toEqual([]);
      });

      it("should not remove a child that does not exist in ASTNodeList", () => {
        const node = new ASTNode.Program();
        const dummyNode = new ASTNode.ExpressionList();
        expect(() => node.removeChild(dummyNode)).toThrow("Node not found");

        const childNode = new ASTNode.Chunk();
        node.addChild(childNode);
        expect(() => node.removeChild(dummyNode)).toThrow("Node not found");
      });

      describe("Node Traversal", () => {
        it("should traverse ASTNodeList", () => {
          const chunkNode = new ASTNode.Chunk();
          const expressionListNode = new ASTNode.ExpressionList();
          const programNode = new ASTNode.Program();
          const numberNode = new ASTNode.NumberLiteral("1");

          const nodeList = new ASTNode.Program([
            chunkNode,
            expressionListNode,
            programNode,
            numberNode,
          ]);

          const visitedNodes: ASTNode.ASTNode[] = [];
          nodeList.traverse(
            () => true,
            (node) => visitedNodes.push(node),
          );

          expect(visitedNodes).toEqual(
            // Unordered array comparison
            expect.arrayContaining([
              chunkNode,
              expressionListNode,
              programNode,
              numberNode,
            ]),
          );
        });

        it("should traverse an ASTNode", () => {
          const variableNode = new ASTNode.LocalVariable("hello");
          const numberNode = new ASTNode.NumberLiteral("1");
          const chunkNode = new ASTNode.Chunk([numberNode]);

          const functionDeclaration = new ASTNode.FunctionDeclaration(
            variableNode,
            [], // No fields
            [], // No parameters
            chunkNode,
          );

          const visitedNodes: ASTNode.ASTNode[] = [];
          functionDeclaration.traverse(
            () => true,
            (node) => visitedNodes.push(node),
          );

          expect(visitedNodes).toEqual(
            // Unordered array comparison
            expect.arrayContaining([
              functionDeclaration,
              variableNode,
              numberNode,
              chunkNode,
            ]),
          );
        });
      });
    });
  });

  describe("Expression Parsing", () => {
    describe("Basic Expressions", () => {
      it("should parse a simple number literal", () => {
        const code = "123";
        const expressionAST = parseExpression(code);
        const expectedNode = new ASTNode.NumberLiteral("123");

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should parse a simple string literal", () => {
        const code = '"hello"';
        const expressionAST = parseExpression(code);
        const expectedNode = new ASTNode.StringLiteral("hello");

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should recognize unary operators", () => {
        const code = "-123";
        const expressionAST = parseExpression(code);
        const expectedNode = new ASTNode.UnaryOperator(
          "-",
          new ASTNode.NumberLiteral("123"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should be able to nest unary operators", () => {
        const code = "- -123";
        const expressionAST = parseExpression(code);
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
        const expressionAST = parseExpression(code);
        const expectedNode = new ASTNode.BinaryOperator(
          "+",
          new ASTNode.NumberLiteral("1"),
          new ASTNode.NumberLiteral("2"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should parse a simple subtraction expression", () => {
        const code = "1 - 2";
        const expressionAST = parseExpression(code);
        const expectedNode = new ASTNode.BinaryOperator(
          "-",
          new ASTNode.NumberLiteral("1"),
          new ASTNode.NumberLiteral("2"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize multiplication over addition", () => {
        const code = "1 + 2 * 3";
        const expressionAST = parseExpression(code);
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
        const expressionAST = parseExpression(code);
        const expectedNode = new ASTNode.BinaryOperator(
          "*",
          new ASTNode.UnaryOperator("-", new ASTNode.NumberLiteral("1")),
          new ASTNode.NumberLiteral("2"),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize unary operators over binary operators (2)", () => {
        const code = "2 ^ -3";
        const expressionAST = parseExpression(code);
        const expectedNode = new ASTNode.BinaryOperator(
          "^",
          new ASTNode.NumberLiteral("2"),
          new ASTNode.UnaryOperator("-", new ASTNode.NumberLiteral("3")),
        );

        expect(expressionAST).toEqual(expectedNode);
      });

      it("should prioritize binary operators with parentheses (1)", () => {
        const code = "(1 + 2) * 3";
        const expressionAST = parseExpression(code);
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
        const expressionAST = parseExpression(code);
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

    it("should parse complex expressions", () => {
      const code =
        "1 + 2 * 3 ^ -4 / -5 % 6 - 7 == 8 ~= 9 < 10 > 11 <= 12 >= 13 and 14 or 15 and -(1 + 2)";
      const expressionAST = parseExpression(code);
      const expectedNode = new ASTNode.BinaryOperator(
        "or",
        new ASTNode.BinaryOperator(
          "and",
          new ASTNode.BinaryOperator(
            "==",
            new ASTNode.BinaryOperator(
              "+",
              new ASTNode.NumberLiteral("1"),
              new ASTNode.BinaryOperator(
                "-",
                new ASTNode.BinaryOperator(
                  "*",
                  new ASTNode.NumberLiteral("2"),
                  new ASTNode.BinaryOperator(
                    "/",
                    new ASTNode.BinaryOperator(
                      "^",
                      new ASTNode.NumberLiteral("3"),
                      new ASTNode.UnaryOperator(
                        "-",
                        new ASTNode.NumberLiteral("4"),
                      ),
                    ),
                    new ASTNode.BinaryOperator(
                      "%",
                      new ASTNode.UnaryOperator(
                        "-",
                        new ASTNode.NumberLiteral("5"),
                      ),
                      new ASTNode.NumberLiteral("6"),
                    ),
                  ),
                ),
                new ASTNode.NumberLiteral("7"),
              ),
            ),
            new ASTNode.BinaryOperator(
              "~=",
              new ASTNode.NumberLiteral("8"),
              new ASTNode.BinaryOperator(
                "<",
                new ASTNode.NumberLiteral("9"),
                new ASTNode.BinaryOperator(
                  ">",
                  new ASTNode.NumberLiteral("10"),
                  new ASTNode.BinaryOperator(
                    "<=",
                    new ASTNode.NumberLiteral("11"),
                    new ASTNode.BinaryOperator(
                      ">=",
                      new ASTNode.NumberLiteral("12"),
                      new ASTNode.NumberLiteral("13"),
                    ),
                  ),
                ),
              ),
            ),
          ),
          new ASTNode.NumberLiteral("14"),
        ),
        new ASTNode.BinaryOperator(
          "and",
          new ASTNode.NumberLiteral("15"),
          new ASTNode.UnaryOperator(
            "-",
            new ASTNode.BinaryOperator(
              "+",
              new ASTNode.NumberLiteral("1"),
              new ASTNode.NumberLiteral("2"),
            ),
          ),
        ),
      );
      expect(expressionAST).toEqual(expectedNode);
    });
  });

  describe("Basic Parsing", () => {
    it("should parse simple local declaration", () => {
      const code = "local a = 1+2";
      const ast = parse(code);

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

    it("should parse simple local declaration with semicolon", () => {
      const code = "local a = 1+2;";
      const ast = parse(code);

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
      const ast = parse(code);

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

  describe("Complex Parsing", () => {
    // !TODO: This is not complete as the ASTNode API expected to change
    //        I will just make basic tests which make sure standard Lua 5.1
    //        Syntax statements don't throw errors

    describe("Control Structures", () => {
      it("should parse a simple if statement", () => {
        const code = `
          if a then
            print("Hello")
          end
        `;
        parse(code);
      });

      it("should parse a simple if-else statement", () => {
        const code = `
          if a then
            print("Hello")
          else
            print("World")
          end
        `;
        parse(code);
      });

      it("should parse a simple if-elseif-else statement", () => {
        const code = `
          if a then
            print("Hello")
          elseif b then
            print("World")
          else
            print("!")
          end
        `;
        parse(code);
      });

      it("should parse a simple while loop", () => {
        const code = `
          while a do
            print("Hello")
          end
        `;
        parse(code);
      });

      it("should parse a simple repeat-until loop", () => {
        const code = 'repeat print("Hello") until a';
        parse(code);
      });

      it("should parse a simple numeric for loop", () => {
        const code = `
          for i = 1, 10, 1 do
            print(i)
          end
        `;
        parse(code);
      });

      it("should parse a simple generic for loop", () => {
        const code = `
          for i, v in ipairs(t) do
            print(i, v)
          end
        `;
        parse(code);
      });

      it("should parse a simple generic for loop with custom state expression", () => {
        const code = `
          for i, j, k in ipairs(t), 1 do
            print(i, j, k)
          end
        `;
        parse(code);
      });

      it("should parse a simple generic for loop with custom state + control expressions", () => {
        const code = `
          for i, j, k in ipairs(t), 1, 2 do
            print(i, j, k)
          end
        `;
        parse(code);
      });

      it("should parse a simple break statement", () => {
        const code = "break";
        parse(code);
      });

      it("should parse a simple do-end block", () => {
        const code = "do local a = 10 end";
        parse(code);
      });
    });

    describe("Return Statements", () => {
      it("should parse a simple return statement", () => {
        const code = "return 1, 2, 3";
        parse(code);
      });

      it("should parse a simple return statement with no values", () => {
        const code = "return";
        parse(code);
      });

      it("should parse a simple return statement with varargs", () => {
        const code = "return ...";
        parse(code);
      });
    });

    describe("Function Definitions", () => {
      it("should parse a simple function definition", () => {
        const code = `
          function foo(a, b)
            return a + b
          end
        `;
        parse(code);
      });

      it("should parse a simple function definition with no arguments", () => {
        const code = `
          function foo()
            return
          end
        `;
        parse(code);
      });

      it("should parse a simple function definition with varargs", () => {
        const code = `
          function foo(a, b, ...)
            return ...
          end
        `;
        parse(code);
      });

      it("should parse a simple local function definition", () => {
        const code = `
          local function foo(a, b)
            return a + b
          end
        `;
        parse(code);
      });

      it("should parse a method definition", () => {
        const code = `
          function obj:method(a, b)
            return a + b
          end
        `;
        parse(code);
      });

      it("should parse a method definition with fields", () => {
        const code = `
          function obj.a.b:method(a, b)
            return a + b
          end
        `;
        parse(code);
      });
    });

    describe("Variable Declarations", () => {
      it("should parse a simple local variable declaration", () => {
        const code = "local a = 10";
        parse(code);
      });

      it("should parse a simple local variable declaration with no value", () => {
        const code = "local a";
        parse(code);
      });

      it("should parse a local variable declaration with multiple variables", () => {
        const code = "local a, b, c = 1, 2, 3";
        parse(code);
      });

      it("should parse a local variable declaration with multiple variables and no values", () => {
        const code = "local a, b, c";
        parse(code);
      });
    });

    describe("Table Constructors", () => {
      it("should parse a simple table constructor", () => {
        const code = "{ a = 1, b = 2, c = 3 }";
        parseExpression(code);
      });

      it("should parse a simple table constructor with implicit keys", () => {
        const code = "{ 1, 2, 3 }";
        parseExpression(code);
      });

      it("should parse a simple table constructor with semicolons as separators", () => {
        const code = "{ a = 1; b = 2; c = 3 }";
        parseExpression(code);
      });

      it("should parse a simple table constructor with implicit keys and semicolons as separators", () => {
        const code = "{ 1; 2; 3 }";
        parseExpression(code);
      });

      it("should parse a simple table constructor with array part", () => {
        const code = "{ 1, 2, 3, a = 4, b = 5 }";
        parseExpression(code);
      });

      it("should parse complex table constructors", () => {
        const code = `
          {
            ["a"] = 1,
            b = {
              c = 2,
              d = 3,
            },
            e = 4,
            [1 + 2] = 5,
            1 + 2,
            ...,
            variable
          }
        `;
        parseExpression(code);
      });
    });

    describe("Function and Method Calls", () => {
      it("should parse a simple function call", () => {
        const code = "foo(1, 2, 3)";
        parse(code);
      });

      it("should parse a simple method call", () => {
        const code = "obj:method(1, 2, 3)";
        parse(code);
      });

      it("should parse a method call with fields", () => {
        const code = "obj.a.b:method(1, 2, 3)";
        parse(code);
      });

      it("should parse a method call with no arguments", () => {
        const code = "obj:method()";
        parse(code);
      });

      it("should parse a function call with implicit string arguments", () => {
        const code = 'foo"hello"';
        parse(code);
      });

      it("should parse a function call with implicit table arguments", () => {
        const code = "foo{ a = 1, b = 2 }";
        parse(code);
      });

      it("should parse a method call with implicit string arguments", () => {
        const code = 'obj:method"hello"';
        parse(code);
      });

      it("should parse a method call with implicit table arguments", () => {
        const code = "obj:method{ a = 1, b = 2 }";
        parse(code);
      });

      it("should parse a method call with implicit table arguments and fields", () => {
        const code = "obj.a.b:method{ a = 1, b = 2 }";
        parse(code);
      });
    });

    describe("Assignments", () => {
      it("should parse a simple assignment", () => {
        const code = "a = 10";
        parse(code);
      });

      it("should parse a simple multiple assignment", () => {
        const code = "a, b, c = 1, 2, 3";
        parse(code);
      });

      it("should parse complex multiple assignments", () => {
        const code = `
          a.b, a.b.c = 1, 2
          a.c.d = 3
          a, b.c = 1
        `;
        parse(code);
      });

      it("should parse assignments with different data types", () => {
        const code = `
          a = "hello"
          b = true
          c = nil
        `;
        parse(code);
      });
    });

    describe("Expressions", () => {
      it("should parse expressions with constants and operators", () => {
        const code = "true and false or nil";
        parseExpression(code);
      });

      it("should parse a simple expression", () => {
        const code = "1 + 2 * 3 - 4 / 5";
        parseExpression(code);
      });

      it("should parse a simple unary expression", () => {
        const code = "-b";
        parseExpression(code);
      });

      it("should parse a simple logical expression", () => {
        const code = "b and c or d";
        parseExpression(code);
      });

      it("should parse a simple relational expression", () => {
        const code = "b < c and d > e";
        parseExpression(code);
      });

      it("should parse a simple concatenation expression", () => {
        const code = '"Hello" .. " " .. "World"';
        parseExpression(code);
      });

      it("should parse a simple index expression", () => {
        const code = "a.b.c";
        parseExpression(code);
      });

      it("should parse a simple bracket expression", () => {
        const code = "a[b]";
        parseExpression(code);
      });

      it("should parse a complex bracket expression", () => {
        const code = "a[b[c] + 1]";
        parseExpression(code);
      });

      it("should parse a simple function call expression", () => {
        const code = "a()";
        parseExpression(code);
      });

      it("should parse a simple method call expression", () => {
        const code = "a:b()";
        parseExpression(code);
      });

      it("should parse anonymous function expression", () => {
        const code = "function(a, b) return a + b end";
        parseExpression(code);
      });

      it("should parse anonymous function expression with no arguments", () => {
        const code = "function() return end";
        parseExpression(code);
      });

      it("should parse anonymous function expression with varargs", () => {
        const code = "function(...) return ... end";
        parseExpression(code);
      });
    });
  });
});
