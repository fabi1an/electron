//@ts-check
import { configFormat, defineESLintConfig } from '@ntnyq/eslint-config'

export default defineESLintConfig(
  {
    ignores: ['**/README.md/*.ts'],
    jsdoc: {
      overrides: {
        'jsdoc/no-types': 'off',
      },
    },
    specials: {
      overridesScriptsRules: {
        'antfu/top-level-function': 'error',
      },
    },
    typescript: {
      overrides: {
        'import-x/consistent-type-specifier-style': ['error', 'prefer-inline'],
        'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
        'no-template-curly-in-string': 'off',
      },
      overridesTypeAwareRules: {
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
      },
      parserOptions: {
        project: ['app/*/tsconfig.json', 'packages/*/tsconfig.json'],
      },
    },
  },
  configFormat({ prettierOptions: { semi: true } }),
)
