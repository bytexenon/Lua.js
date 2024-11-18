import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeCheckedOnly,
  ...tseslint.configs.stylisticTypeCheckedOnly,
  {
    // Ignore patterns
    ignores: [
      "dist/**/*.ts",
      "dist/**",
      "**/*.mjs",
      "eslint.config.mjs",
      "coverage/**",
    ],
  },
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        projectService: true,
        allowDefaultProject: true,
        tsconfigRootDir: import.meta.dirname,
        project: "tsconfig.json",
      },
      globals: {
        ...globals.builtin,
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      quotes: [
        "error",
        "double",
        { avoidEscape: true, allowTemplateLiterals: false },
      ],
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            constructors: "no-public",
          },
        },
      ],
      "import/named": "error",
      "import/namespace": "error",
      "import/default": "error",
      "import/export": "error",
      "import/no-named-as-default": "error",
      "import/no-unused-modules": "error",
      "import/no-named-as-default-member": "error",
      "import/no-mutable-exports": "error",
      "import/no-extraneous-dependencies": "error",
      "import/no-empty-named-blocks": "error",
      "import/no-deprecated": "error",
      "import/first": "error",
      "import/exports-last": "error",
      "import/no-duplicates": "error",
      "import/order": "error",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "array-callback-return": "error",
      "no-undef": "error",
      "prefer-const": "error",
      "no-duplicate-case": "error",
      "for-direction": "error",
      "no-useless-backreference": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "default-case-last": "error",
      "require-atomic-updates": "warn",
      "use-isnan": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-empty-character-class": "error",
      "no-misleading-character-class": "error",
      "no-sparse-arrays": "error",
      "no-template-curly-in-string": "error",
      "no-var": "error",
      "no-unexpected-multiline": "error",
      "no-new-symbol": "error",
      eqeqeq: "error",
      "no-fallthrough": "error",
      "no-implicit-coercion": "error",
      radix: "error",
      "no-invalid-regexp": "error",
      "require-unicode-regexp": "error",
      "handle-callback-err": "error",
      "no-bitwise": "error",
      "no-unmodified-loop-condition": "error",
      "no-import-assign": "error",
      "no-dupe-else-if": "error",
      "consistent-return": "error",
      "no-extra-bind": "error",
      "no-extra-label": "error",
      "no-unused-labels": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "no-useless-call": "error",
      "no-useless-catch": "error",
      "no-useless-concat": "error",
      "no-useless-escape": "error",
      "prefer-promise-reject-errors": "error",
      yoda: "error",
      "no-else-return": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      "require-yield": "error",
      "no-unsafe-finally": "error",
      "object-shorthand": ["error", "methods"],
      "prefer-numeric-literals": "error",
      "prefer-arrow-callback": "error",
      "symbol-description": "error",
      "no-extra-boolean-cast": "error",
      "no-duplicate-imports": ["error", { includeExports: true }],
      "no-useless-computed-key": "error",
      "no-useless-rename": "error",
      "no-multi-str": "error",
      "no-new-wrappers": "error",
      "no-useless-return": "error",
      "no-label-var": "error",
      "no-new-require": "error",
      "max-nested-callbacks": ["error", { max: 4 }],
      "func-name-matching": "error",
      "no-unneeded-ternary": "error",
      "operator-assignment": "error",
      "prefer-object-spread": "error",
      "default-param-last": "error",
      "prefer-regex-literals": "error",
      "no-constructor-return": "error",
      "no-setter-return": "error",
      "grouped-accessor-pairs": "error",
      "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
      "no-floating-decimal": "error",
      "accessor-pairs": "error",
      "no-case-declarations": "error",
      curly: "error",
      "prefer-exponentiation-operator": "error",
      "no-undef-init": "error",
      "no-func-assign": "error",
      "no-console": "error",
      "no-debugger": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-ex-assign": "error",
      "no-irregular-whitespace": "error",
      "no-prototype-builtins": "error",
      "no-regex-spaces": "error",
      "no-alert": "error",
      "no-caller": "error",
      "no-empty-pattern": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-shadow-restricted-names": "error",
      "no-path-concat": "error",
      "no-iterator": "error",
      "no-extend-native": "error",
      "no-global-assign": "error",
      "no-with": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-proto": "error",
      "no-return-assign": "error",
      "no-script-url": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "no-throw-literal": "error",
      "no-sequences": "error",
      "one-var": ["error", "never"],
      "func-names": "error",
      "new-cap": "error",
    },
  },
);
