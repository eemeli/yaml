import { Type } from '../constants.js'
import { Pair } from './Pair.js'
import { Scalar } from './Scalar.js'
import { YAMLMap } from './YAMLMap.js'
import { YAMLSeq } from './YAMLSeq.js'

const BREAK = Symbol('break visit')

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

  if (ctrl === BREAK) return BREAK
  if (ctrl !== false && children.length > 0) {
    path = Object.freeze(path.concat(node))
    for (const item of children) {
      ctrl = _visit(item, visitor, path)
      if (ctrl === BREAK) return BREAK
    }
  }
}

export function visit(node, visitor) {
  _visit(node, visitor, Object.freeze([]))
}

visit.BREAK = BREAK
