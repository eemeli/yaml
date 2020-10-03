import babel from '@rollup/plugin-babel'

export default {
  input: ['src/index.js', 'src/test-events.js', 'src/types.js', 'src/util.js', 'src/ast/index.js'],
  output: { dir: 'lib', format: 'cjs', esModule: false, preserveModules: true },
  plugins: [babel()]
}
