const js = require("@eslint/js");
const prettier = require("eslint-plugin-prettier");
const eslintConfigPrettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/", "dist/", "coverage/"],
  },
  {
    files: ["**/*.{js,cjs}", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.{js,cjs}"],
    plugins: {
      prettier,
    },
    rules: {
      semi: ["error", "always"],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
];
