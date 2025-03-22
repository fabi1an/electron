//@ts-check
import { defineESLintConfig } from '@ntnyq/eslint-config'

export default defineESLintConfig({
  ignores: ['**/README.md/*.ts'],
  jsdoc: {
    overrides: {
      'jsdoc/no-types': 'off',
    },
  },
  typescript: {
    overrides: {
      '@typescript-eslint/no-use-before-define': 'off',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-inline'],
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
    },
    parserOptions: {
      project: ['app/*/tsconfig.json', 'packages/*/tsconfig.json'],
    },
  },
})
