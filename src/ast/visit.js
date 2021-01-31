import { Type } from '../constants.js'
import { Pair } from './Pair.js'
import { Scalar } from './Scalar.js'
import { YAMLMap } from './YAMLMap.js'
import { YAMLSeq } from './YAMLSeq.js'

function _visit(node, visitor, path) {
  let ctrl = typeof visitor === 'function' ? visitor(node, path) : undefined
  let children = []

  if (node instanceof YAMLMap) {
    if (visitor.Map) ctrl = visitor.Map(node, path)
    children = node.items
  } else if (node instanceof YAMLSeq) {
    if (visitor.Seq) ctrl = visitor.Seq(node, path)
    children = node.items
  } else if (node instanceof Pair) {
    if (visitor.Pair) ctrl = visitor.Pair(node, path)
    children = [node.key, node.value]
  } else if (node instanceof Scalar) {
    if (visitor.Scalar) ctrl = visitor.Scalar(node, path)
  } else if (node && node.type === Type.DOCUMENT) {
    if (visitor.Document) ctrl = visitor.Document(node, path)
    children = [node.contents]
  }

  if (ctrl !== false && children.length > 0) {
    path = Object.freeze(path.concat(node))
    for (const item of children) _visit(item, visitor, path)
  }
}

/**
 * Apply a visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling each of
 * the visitor functions (if defined) according to the current node type.
 */
export function visit(node, visitor) {
  _visit(node, visitor, Object.freeze([]))
}
