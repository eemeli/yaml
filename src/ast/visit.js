import { Type } from '../constants.js'
import { Pair } from './Pair.js'
import { Scalar } from './Scalar.js'
import { YAMLMap } from './YAMLMap.js'
import { YAMLSeq } from './YAMLSeq.js'

/**
 * Apply a visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling each of
 * the visitor functions (if defined) according to the current node type.
 */
export function visit(node, visitor) {
  if (typeof visitor === 'function') visitor(node)
  if (node instanceof YAMLMap) {
    if (visitor.Map) visitor.Map(node)
    for (const item of node.items) visit(item, visitor)
  } else if (node instanceof YAMLSeq) {
    if (visitor.Seq) visitor.Seq(node)
    for (const item of node.items) visit(item, visitor)
  } else if (node instanceof Pair) {
    if (visitor.Pair) visitor.Pair(node)
    visit(node.key, visitor)
    visit(node.value, visitor)
  } else if (node instanceof Scalar) {
    if (visitor.Scalar) visitor.Scalar(node)
  } else if (node && node.type === Type.DOCUMENT) {
    if (visitor.Document) visitor.Document(node)
    visit(node.contents, visitor)
  }
}
