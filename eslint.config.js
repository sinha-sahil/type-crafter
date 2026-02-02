import love from 'eslint-config-love';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'examples/',
      'coverage/',
      '*.config.js',
      'mcp/',
      'scripts/'
    ]
  },
  {
    ...love,
    files: ['**/*.ts'],
    rules: {
      ...love.rules,
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false
          }
        }
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // Relax some stricter rules to match existing codebase style
      'prefer-template': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-negated-condition': 'off',
      'no-useless-assignment': 'off',
      'no-await-in-loop': 'off',
      'guard-for-in': 'off',
      'complexity': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'arrow-body-style': 'off',
      'max-lines': 'off',
      'no-plusplus': 'off',
      'no-param-reassign': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'require-unicode-regexp': 'off',
      '@typescript-eslint/max-params': 'off',
      'import/enforce-node-protocol-usage': 'off',
      'no-console': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unnecessary-template-expression': 'off'
    }
  },
  eslintConfigPrettier
];
