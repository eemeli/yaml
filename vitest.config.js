import { resolve } from 'node:path'
import { env } from 'node:process'
import { defineConfig } from 'vitest/config'

let getPath
if (!!env.TEST_DIST || env.npm_lifecycle_event === 'test:dist') {
  console.log('Testing build output from dist/')
  getPath = name => resolve(import.meta.dirname, 'dist', `${name}.js`)
} else {
  getPath = name => resolve(import.meta.dirname, 'src', `${name}.ts`)
}

export default defineConfig({
  test: {
    alias: {
      '../src/test-events.ts': getPath('test-events'),
      'yaml/cli': getPath('cli'),
      'yaml/util': getPath('util'),
      yaml: getPath('index')
    },
    globals: true,
    setupFiles: ['tests/_setup.ts'],
    include: ['tests/**/*.{js,ts}'],
    exclude: ['tests/_*', 'tests/artifacts/', 'tests/json-test-suite/']
  }
})
