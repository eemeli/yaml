import eslint from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import typescript from 'typescript-eslint'

export default [
  {
    ignores: [
      'browser/',
      'dist/',
      'docs/',
      'docs-slate/',
      'lib/',
      'package-lock.json',
      'playground/dist/',
      'tests/artifacts/',
      'tests/json-test-suite/',
      'tests/yaml-test-suite/'
    ]
  },
  eslint.configs.recommended,
  ...typescript.configs.recommendedTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*js', 'config/*js'],
          defaultProject: 'tsconfig.json'
        }
      }
    },

    rules: {
      'array-callback-return': 'error',
      camelcase: 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-control-regex': 'off',
      'no-fallthrough': ['error', { commentPattern: 'fallthrough' }],
      'no-implicit-globals': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\..*(?<!\\.ts)$',
              message: 'Relative imports must use .ts extension.'
            }
          ]
        }
      ],
      'no-template-curly-in-string': 'warn',
      'no-var': 'error',
      'prefer-const': ['warn', { destructuring: 'all' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'warn',
        { ignoreMixedLogicalExpressions: true }
      ],
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off'
    }
  },

  {
    files: ['config/**'],
    languageOptions: { globals: { console: true, module: true, process: true } }
  },

  {
    files: ['tests/**'],
    rules: {
      camelcase: 0,
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off'
    }
  }
]
