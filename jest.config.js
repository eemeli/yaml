let moduleNameMapper
const testPathIgnorePatterns = ['tests/_import', 'cst/common']

// The npm script name is significant.
switch (process.env.npm_lifecycle_event) {
  case 'test:dist':
    moduleNameMapper = {}
    testPathIgnorePatterns.push(
      'cst/Node',
      'cst/set-value',
      'cst/source-utils',
      'cst/YAML-1.2',
      'doc/createNode',
      'doc/errors',
      'doc/foldFlowLines',
      'doc/types'
    )
    break

  case 'test':
  default:
    process.env.TRACE_LEVEL = 'log'
    moduleNameMapper = {
      '^\\./dist$': '<rootDir>/src/index.ts',
      '^\\./dist/types(\\.js)?$': '<rootDir>/src/types.ts',
      '^\\./dist/(.+)$': '<rootDir>/src/$1',
      '^\\.\\./dist/test-events.js$': '<rootDir>/src/test-events.ts'
    }
}

module.exports = {
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.d.ts'],
  moduleNameMapper,
  resolver: 'jest-ts-webcompat-resolver',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.{js,ts}'],
  testPathIgnorePatterns,
  transform: { '/(src|tests)/.*\\.(js|ts)$': 'babel-jest' }
}
