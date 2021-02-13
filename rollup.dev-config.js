import { resolve } from 'path'
import babel from '@rollup/plugin-babel'

export default {
  input: ['src/ast/index.js', 'src/doc/Document.js'],
  external: [
    resolve('src/doc/directives.js'),
    resolve('src/errors.js'),
    resolve('src/options.js'),
    resolve('src/tags/options.js')
  ],
  output: { dir: 'lib', format: 'cjs', esModule: false, preserveModules: true },
  plugins: [babel()]
}
