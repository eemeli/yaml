import typescript from '@rollup/plugin-typescript'
import * as ts from 'typescript'

/**
 * Drop .ts extension from import & export paths in .d.ts files
 * to support older TS versions.
 *
 * @param {ts.TransformationContext} context
 */
function fixDeclarationImportPaths(context) {
  /** @param {ts.SourceFile} source */
  return function fixPaths(source) {
    /** @param {ts.Node} node */
    function visitor(node) {
      if (ts.isStringLiteral(node) && /^\.+\/.*\.ts$/.test(node.text)) {
        return ts.factory.createStringLiteral(node.text.slice(0, -3), true)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(source, visitor)
  }
}

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

/**
 * Leave out `node:` prefix as unsupported in Node.js < 14.18
 *
 * @param {string} id
 */
const fixNodePaths = id =>
  id.startsWith('node:') ? id.substring(5) : undefined

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
      preserveModules: true,
      paths: fixNodePaths
    },
    external: ['node:buffer', 'node:process'],
    plugins: [
      typescript({
        transformers: { afterDeclarations: [fixDeclarationImportPaths] }
      })
    ],
    treeshake: { moduleSideEffects: false, propertyReadSideEffects: false }
  },
  {
    input: 'src/cli.ts',
    output: { file: 'dist/cli.mjs', paths: fixNodePaths },
    external: () => true,
    plugins: [
      typescript({
        declaration: false,
        transformers: { after: [fixDynamicImportRewrite] }
      })
    ]
  }
]
