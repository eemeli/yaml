import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'

export default {
  input: {
    index: 'src/index.ts',
    'test-events': 'src/test-events.js',
    types: 'src/types.js',
    util: 'src/util.js'
  },
  output: {
    dir: 'dist',
    format: 'cjs',
    esModule: false,
    preserveModules: true
  },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/env', { modules: false, targets: { node: '10.0' } }]]
    }),
    typescript()
  ],
  treeshake: { moduleSideEffects: false, propertyReadSideEffects: false }
}
