import { Type } from '../constants.js'
import { Pair } from './Pair.js'
import { Scalar } from './Scalar.js'
import { YAMLMap } from './YAMLMap.js'
import { YAMLSeq } from './YAMLSeq.js'

function _visit(node, visitor, path) {
  if (typeof visitor === 'function') visitor(node, path)
  if (node instanceof YAMLMap) {
    if (visitor.Map) visitor.Map(node, path)
    path = Object.freeze(path.concat(node))
    for (const item of node.items) _visit(item, visitor, path)
  } else if (node instanceof YAMLSeq) {
    if (visitor.Seq) visitor.Seq(node, path)
    path = Object.freeze(path.concat(node))
    for (const item of node.items) _visit(item, visitor, path)
  } else if (node instanceof Pair) {
    if (visitor.Pair) visitor.Pair(node, path)
    path = Object.freeze(path.concat(node))
    _visit(node.key, visitor, path)
    _visit(node.value, visitor, path)
  } else if (node instanceof Scalar) {
    if (visitor.Scalar) visitor.Scalar(node, path)
  } else if (node && node.type === Type.DOCUMENT) {
    if (visitor.Document) visitor.Document(node, path)
    path = Object.freeze(path.concat(node))
    _visit(node.contents, visitor, path)
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
