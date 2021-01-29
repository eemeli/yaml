import babel from '@rollup/plugin-babel'

export default {
  input: {
    index: 'src/index.js',
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
      presets: [['@babel/env', { modules: false, targets: { node: '6.5' } }]]
    })
  ],
  treeshake: { moduleSideEffects: false, propertyReadSideEffects: false }
}
