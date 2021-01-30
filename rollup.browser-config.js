import babel from '@rollup/plugin-babel'

export default {
  input: {
    index: 'src/index.js',
    types: 'src/types.js',
    util: 'src/util.js'
  },
  output: { dir: 'browser/dist', format: 'esm' },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/env', { modules: false }]]
    })
  ]
}
