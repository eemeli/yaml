import { resolve } from 'path'
import babel from '@rollup/plugin-babel'

export default {
  input: [
    'src/ast/index.js',
    'src/doc/Document.js',
    'src/errors.js',
    'src/options.js'
  ],
  external: [resolve('src/doc/directives.js')],
  output: { dir: 'lib', format: 'cjs', esModule: false, preserveModules: true },
  plugins: [babel()]
}
