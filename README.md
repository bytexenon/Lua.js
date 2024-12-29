
# Lua.js

[ALPHA] A non-crappy Lua 5.1 - 5.4 parsing and compiling library.

## Description

Lua.js is a modular and fast Lua interpreter written in TypeScript and JavaScript. It supports parsing and compiling Lua versions 5.1 to 5.4.

## Features

- Supports Lua 5.1 - 5.4
- Modular design
- Written in TypeScript for type safety
- Fast and efficient parsing and compiling

## Installation

To install Lua.js, use npm:

```bash
npm install git+https://github.com/bytexenon/Lua.js
```

## Usage

Here's a basic example of how to use Lua.js:

```typescript
import { Lexer, Parser, Compiler } from 'lua-js';

const luaCode = `
print("Hello, Lua!")
`;

const lexer = new Lexer(luaCode);
const parser = new Parser(lexer);
const ast = parser.parse();
const compiler = new Compiler(ast);
const bytecode = compiler.compile();

console.log(bytecode);
```

## Scripts

- `start`: Build and run the project
- `build`: Compile TypeScript to JavaScript
- `lint`: Run ESLint
- `format`: Format code with Prettier
- `clean`: Remove the dist directory
- `test`: Run tests with Jest
- `bundle`: Bundle the project with Rollup
- `prepublishOnly`: Build the project before publishing

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

## Author

@bytexenon

## Links

- [Repository](https://github.com/bytexenon/Lua.js)
- [Issues](https://github.com/bytexenon/Lua.js/issues)
- [Homepage](https://github.com/bytexenon/Lua.js#readme)
