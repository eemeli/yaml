import typescript from '@rollup/plugin-typescript'

export default {
  input: {
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
  plugins: [typescript()],
  treeshake: { moduleSideEffects: false, propertyReadSideEffects: false }
}
