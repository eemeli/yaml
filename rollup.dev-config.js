import babel from '@rollup/plugin-babel'

export default {
  input: [
    'src/ast/index.js',
    'src/doc/Document.js',
    'src/errors.js',
    'src/options.js'
  ],
  output: { dir: 'lib', format: 'cjs', esModule: false, preserveModules: true },
  plugins: [babel()]
}
