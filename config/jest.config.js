let moduleNameMapper

const babel = [
  'babel-jest',
  {
    overrides: [
      {
        test: '**/*.ts',
        plugins: [
          ['@babel/plugin-transform-typescript', { allowDeclareFields: true }]
        ]
      }
    ],
    presets: [['@babel/env', { targets: { node: 'current' } }]]
  }
]

const transform = {
  '[/\\\\]tests[/\\\\].*\\.(m?js|ts)$': babel
}

// The npm script name is significant.
switch (process.env.npm_lifecycle_event) {
  case 'test:dist':
    console.log('Testing build output from dist/')
    moduleNameMapper = {
      '^yaml$': '<rootDir>/dist/index.js',
      '^yaml/cli$': '<rootDir>/dist/cli.mjs',
      '^yaml/util$': '<rootDir>/dist/util.js',
      '^../src/test-events.ts$': '<rootDir>/dist/test-events.js'
    }
    transform['[/\\\\]dist[/\\\\].*\\.mjs$'] = babel
    break

  case 'test':
  default:
    process.env.TRACE_LEVEL = 'log'
    moduleNameMapper = {
      '^yaml$': '<rootDir>/src/index.ts',
      '^yaml/cli$': '<rootDir>/src/cli.ts',
      '^yaml/util$': '<rootDir>/src/util.ts'
    }
    transform['[/\\\\]src[/\\\\].*\\.ts$'] = babel
}

module.exports = {
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.d.ts'],
  moduleNameMapper,
  resolver: 'jest-ts-webcompat-resolver',
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.{js,ts}'],
  testPathIgnorePatterns: ['tests/_utils', 'tests/json-test-suite/'],
  transform
}
