let moduleNameMapper
const testPathIgnorePatterns = ['tests/common', 'cst/common']

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
      '^\\./dist$': '<rootDir>/src/index.js',
      '^\\./dist/parse-cst(\\.js)?$': '<rootDir>/src/cst/parse.js',
      '^\\./dist/types(\\.js)?$': '<rootDir>/src/types.js',
      '^\\./dist/(.+)$': '<rootDir>/src/$1',
      '^\\.\\./dist/test-events.js$': '<rootDir>/src/test-events.js'
    }
}

module.exports = {
  collectCoverageFrom: ['src/**/*.js'],
  moduleNameMapper,
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.js'],
  testPathIgnorePatterns,
  transform: { '/(src|tests)/.*\\.js$': 'babel-jest' }
}
