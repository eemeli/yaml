import typescript from '@rollup/plugin-typescript'
import * as ts from 'typescript'

/**
 * Strip out TS relative import path rewrite helper from dynamic import() calls
 *
 * Required due to
 * https://github.com/rollup/plugins/issues/1820
 *
 * @param {ts.TransformationContext} context
 */
function fixDynamicImportRewrite(context) {
  /** @param {ts.SourceFile} source */
  return function fixDynamicImport(source) {
    /** @param {ts.Node} node */
    function visitor(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        String(node.expression.escapedText) ===
          '___rewriteRelativeImportExtension' &&
        node.arguments.length === 1
      ) {
        return node.arguments[0]
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(source, visitor)
  }
}

export default [
  {
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
  },
  {
    input: 'src/cli.ts',
    output: { file: 'dist/cli.mjs' },
    external: () => true,
    plugins: [
      typescript({ transformers: { after: [fixDynamicImportRewrite] } })
    ]
  }
]
