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

const bsProvider = opts =>
  playwright({
    connectOptions: {
      wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
        JSON.stringify({ ...bsDefaults, ...opts })
      )}`
    }
  })

export default defineConfig({
  test: {
    alias: [
      {
        find: /^yaml/,
        customResolver(path) {
          const name = path.split('/')[1] ?? 'index'
          return resolve(import.meta.dirname, '..', 'dist', `${name}.js`)
        }
      }
    ],
    api: { host: '0.0.0.0' },
    browser: {
      enabled: true,
      provider: playwright(),
      connectTimeout: 120_000,
      instances: [
        {
          name: 'Chrome Old',
          browser: 'chromium',
          provider: bsProvider({ browser: 'chrome', browser_version: '93' })
        },
        {
          name: 'Chrome New',
          browser: 'chromium',
          provider: bsProvider({ browser: 'chrome', browser_version: 'latest' })
        },
        {
          name: 'Firefox Old',
          browser: 'chromium',
          provider: bsProvider({
            browser: 'playwright-firefox',
            browser_version: '94'
          })
        },
        {
          name: 'Firefox New',
          browser: 'chromium',
          provider: bsProvider({
            browser: 'playwright-firefox',
            browser_version: 'latest'
          })
        }
      ]
    },
    globals: true,
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
