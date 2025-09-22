import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import ts from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser },
    plugins: { '@typescript-eslint': ts },
    rules: { ...js.configs.recommended.rules, ...ts.configs.recommended.rules, ...prettier.rules }
  }
];
