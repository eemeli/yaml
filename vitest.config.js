import { resolve } from 'node:path'
import { env } from 'node:process'
import { defineConfig } from 'vitest/config'

let alias
if (env.TEST_DIST || env.npm_lifecycle_event === 'test:dist') {
  console.log('Testing build output from dist/')
  alias = [
    {
      find: /^yaml/,
      /** @param {string} path */
      customResolver(path) {
        const name = path.split('/')[1] ?? 'index'
        return resolve(import.meta.dirname, 'dist', `${name}.js`)
      }
    },
    {
      find: '../src/test-events.ts',
      replacement: resolve(import.meta.dirname, 'dist', 'test-events.js')
    }
  ]
} else {
  alias = [
    {
      find: /^yaml/,
      /** @param {string} path */
      customResolver(path) {
        const name = path.split('/')[1] ?? 'index'
        return resolve(import.meta.dirname, 'src', `${name}.ts`)
      }
    }
  ]
}

export default defineConfig({
  test: {
    alias,
    globals: true,
    include: ['tests/**/*.{js,ts}'],
    exclude: ['tests/_*', 'tests/artifacts/', 'tests/json-test-suite/']
  }
})
