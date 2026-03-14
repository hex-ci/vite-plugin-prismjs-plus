import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['coverage/**', 'node_modules/**'],
  },
];
