import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

export default defineConfig({
  input: [
    './src/cli.ts',
    './src/index.ts',
    './src/test-events.ts',
    './src/util.ts'
  ],
  external: /^node:/,
  plugins: [dts()],
  output: { cleanDir: true, dir: './dist/', format: 'esm' }
})
