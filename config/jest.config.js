let moduleNameMapper
const testPathIgnorePatterns = ['tests/_utils']

// The npm script name is significant.
switch (process.env.npm_lifecycle_event) {
  case 'test:dist':
    moduleNameMapper = {
      '^yaml$': '<rootDir>/dist/index.js',
      '^yaml/util$': '<rootDir>/dist/util.js',
      '^yaml/test-events$': '<rootDir>/dist/test-events.js'
    }
    //testPathIgnorePatterns.push('doc/createNode', 'doc/types')
    break

  case 'test':
  default:
    process.env.TRACE_LEVEL = 'log'
    moduleNameMapper = {
      '^yaml$': '<rootDir>/src/index.ts',
      '^yaml/util$': '<rootDir>/src/util.ts',
      '^yaml/test-events$': '<rootDir>/src/test-events.ts'
    }
}

module.exports = {
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.d.ts'],
  moduleNameMapper,
  resolver: 'jest-ts-webcompat-resolver',
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.{js,ts}'],
  testPathIgnorePatterns,
  transform: {
    '/(src|tests)/.*\\.(js|ts)$': [
      'babel-jest',
      { configFile: './config/babel.config.js' }
    ]
  }
}
