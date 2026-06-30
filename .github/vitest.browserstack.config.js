import { resolve } from 'node:path'
import { env } from 'node:process'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const bsDefaults = {
  project: env.BROWSERSTACK_PROJECT_NAME,
  build: process.env.BROWSERSTACK_BUILD_NAME,
  'browserstack.idleTimeout': 600,
  'browserstack.local': 'true',
  'browserstack.localIdentifier': env.BROWSERSTACK_LOCAL_IDENTIFIER,
  'browserstack.username': env.BROWSERSTACK_USERNAME,
  'browserstack.accessKey': env.BROWSERSTACK_ACCESS_KEY || env.BROWSERSTACK_KEY
}

// e.g. BROWSERS="chrome:93 chrome:latest firefox:94 firefox:latest"
const instances = env.BROWSERS.split(' ').map(name => {
  let [browser, browser_version] = name.split(':')
  if (browser !== 'chrome') browser = `playwright-${browser}`
  const caps = JSON.stringify({ ...bsDefaults, browser, browser_version })
  const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(caps)}`
  const provider = playwright({ connectOptions: { wsEndpoint } })
  return { name, browser: 'chromium', provider }
})

export default defineConfig({
  test: {
    alias: {
      'yaml/cli': resolve(import.meta.dirname, '..', 'dist', 'cli.js'),
      'yaml/util': resolve(import.meta.dirname, '..', 'dist', 'util.js'),
      yaml: resolve(import.meta.dirname, '..', 'dist', 'index.js')
    },
    api: { host: '0.0.0.0' },
    browser: {
      enabled: true,
      provider: playwright(),
      connectTimeout: 300_000,
      instances
    },
    globals: true,
    setupFiles: ['tests/_setup.ts'],
    include: ['tests/**/*.{js,ts}'],
    exclude: [
      'tests/_*',
      'tests/artifacts/',
      'tests/json-test-suite/',
      'tests/json-test-suite.ts',
      'tests/yaml-test-suite.ts',
      'tests/cli.ts'
    ]
  }
})
