const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...prettier.rules,
    },
  },
];
