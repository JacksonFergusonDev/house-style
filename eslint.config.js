import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['tests/**/*.js', 'browser-tests/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['browser-tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
