import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import ts from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser },
    plugins: { '@typescript-eslint': ts, react, 'react-hooks': hooks, 'jsx-a11y': a11y },
    rules: { ...js.configs.recommended.rules, ...ts.configs.recommended.rules, ...prettier.rules,
      'react/react-in-jsx-scope':'off', 'react/prop-types':'off' },
    settings: { react: { version: 'detect' } }
  }
];
