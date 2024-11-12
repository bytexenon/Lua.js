/* eslint-disable no-console */

/* Dependencies */
import { Lexer } from "./lexer/lexer.js";
import { Parser } from "./parser/parser.js";

/* Code */
const code = `
if 1 == 2 then
elseif 2 then
else
  local a = 10
end
`.repeat(1);

console.log(`Processing ${code.length / 1024 / 1024} MB of data`);

const lexer = new Lexer(code);
const tokens = lexer.lex();
console.log(tokens);
const parser = new Parser(tokens);
const ast = parser.parse();

ast.print();
ast.traverse(
  () => true,
  (obj) => {
    console.log(obj);
  }
);
