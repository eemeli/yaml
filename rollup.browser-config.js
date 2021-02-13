import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'

export default {
  input: {
    index: 'src/index.ts',
    types: 'src/types.js',
    util: 'src/util.js'
  },
  output: { dir: 'browser/dist', format: 'esm', preserveModules: true },
  plugins: [
    replace({
      'process.env.LOG_TOKENS': String(!!process.env.LOG_TOKENS),
      'process.env.LOG_STREAM': String(!!process.env.LOG_STREAM)
    }),
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/env', { modules: false }]]
    }),
    typescript()
  ],
  treeshake: { moduleSideEffects: false, propertyReadSideEffects: false }
}
