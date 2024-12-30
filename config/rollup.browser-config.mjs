import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import typescript from '@rollup/plugin-typescript'

/** @type {import('rollup').RollupOptions} */
export default {
  input: {
    index: 'src/index.ts',
    util: 'src/util.ts'
  },
  output: { dir: 'browser/dist', format: 'esm', preserveModules: true },
  plugins: [
    replace({ preventAssignment: true }),
    babel({
      babelHelpers: 'bundled',
      presets: [['@babel/env', { modules: false }]]
    }),
    typescript({ declaration: false, outDir: 'browser/dist' }),
    {
      resolveId: source =>
        ['node:buffer', 'node:process'].includes(source) ? source : null,
      load(id) {
        switch (id) {
          case 'node:buffer':
            return 'export const Buffer = null;'
          case 'node:process':
            return (
              'export const emitWarning = null;' +
              `export const env = { LOG_STREAM: ${!!process.env.LOG_STREAM}, LOG_TOKENS: ${!!process.env.LOG_TOKENS} };`
            )
        }
      }
    }
  ],
  treeshake: { moduleSideEffects: false, propertyReadSideEffects: false }
}
