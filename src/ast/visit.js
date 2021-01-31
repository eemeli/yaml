import { Type } from '../constants.js'
import { Node } from './Node.js'
import { Pair } from './Pair.js'
import { Scalar } from './Scalar.js'
import { YAMLMap } from './YAMLMap.js'
import { YAMLSeq } from './YAMLSeq.js'

const BREAK = Symbol('break visit')
const SKIP = Symbol('skip children')
const REMOVE = Symbol('remove node')

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

  if (ctrl instanceof Node) {
    const parent = path[path.length - 1]
    if (parent instanceof YAMLMap || parent instanceof YAMLSeq) {
      const idx = parent.items.indexOf(node)
      if (idx !== -1) parent.items.splice(idx, 1, ctrl)
    } else if (parent instanceof Pair) {
      if (parent.key === node) parent.key = ctrl
      else if (parent.value === node) parent.value = ctrl
    } else if (parent && parent.type === Type.DOCUMENT) {
      parent.contents = ctrl
    } else {
      const pt = parent && parent.type
      throw new Error(`Cannot replace node with ${pt} parent`)
    }
    return _visit(ctrl, visitor, path)
  }

  if (ctrl === REMOVE) {
    const parent = path[path.length - 1]
    if (parent instanceof YAMLMap || parent instanceof YAMLSeq) {
      const idx = parent.items.indexOf(node)
      if (idx !== -1) parent.items.splice(idx, 1)
    } else if (parent instanceof Pair) {
      if (parent.key === node) parent.key = null
      else if (parent.value === node) parent.value = null
    } else if (parent && parent.type === Type.DOCUMENT) {
      parent.contents = null
    } else {
      const pt = parent && parent.type
      throw new Error(`Cannot remove node with ${pt} parent`)
    }
  }

  if (typeof ctrl === 'symbol') return ctrl

  if (children.length > 0) {
    path = Object.freeze(path.concat(node))
    for (let i = 0; i < children.length; ++i) {
      ctrl = _visit(children[i], visitor, path)
      if (ctrl === BREAK) return BREAK
      else if (
        ctrl === REMOVE &&
        (node instanceof YAMLMap || node instanceof YAMLSeq)
      )
        i -= 1
    }
  }
}

export function visit(node, visitor) {
  _visit(node, visitor, Object.freeze([]))
}

visit.BREAK = BREAK
visit.SKIP = SKIP
visit.REMOVE = REMOVE
