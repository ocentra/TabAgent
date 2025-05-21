import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['src/xenova/**', 'src/assets/**', 'src/theme-loader.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.worker,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Disable the default ESLint no-unused-vars rule
      'no-unused-vars': 'off',
      // Use TypeScript-specific no-unused-vars rule and disable it
      '@typescript-eslint/no-unused-vars': 'off',
      // Alternatively, configure it to allow unused variables with specific patterns
      // '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];