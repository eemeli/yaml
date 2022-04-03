let moduleNameMapper
const transform = {
  '[/\\\\]tests[/\\\\].*\\.(js|ts)$': [
    'babel-jest',
    { configFile: './config/babel.config.js' }
  ]
}

// The npm script name is significant.
switch (process.env.npm_lifecycle_event) {
  case 'test:dist':
    console.log('Testing build output from dist/')
    moduleNameMapper = {
      '^yaml$': '<rootDir>/dist/index.js',
      '^yaml/util$': '<rootDir>/dist/util.js',
      '^../src/test-events$': '<rootDir>/dist/test-events.js'
    }
    break

  case 'test':
  default:
    process.env.TRACE_LEVEL = 'log'
    moduleNameMapper = {
      '^yaml$': '<rootDir>/src/index.ts',
      '^yaml/util$': '<rootDir>/src/util.ts'
    }
    transform['[/\\\\]src[/\\\\].*\\.ts$'] = [
      'babel-jest',
      { configFile: './config/babel.config.js' }
    ]
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
