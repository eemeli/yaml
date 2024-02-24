import { chmod, stat } from 'node:fs/promises'
import typescript from '@rollup/plugin-typescript'

export default {
  input: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
    'test-events': 'src/test-events.ts',
    util: 'src/util.ts'
  },
  output: {
    dir: 'dist',
    format: 'cjs',
    esModule: false,
    preserveModules: true
  },
  external: ['node:util'],
  plugins: [
    typescript(),
    {
      async writeBundle() {
        // chmod a+x dist/cli.js
        const file = 'dist/cli.js'
        const prev = await stat(file)
        await chmod(file, prev.mode | 0o111)
      }
    }
  ],
  treeshake: { moduleSideEffects: false, propertyReadSideEffects: false }
}
