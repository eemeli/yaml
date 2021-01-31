import { Type } from '../constants.js'
import { Alias } from './Alias.js'
import { Node } from './Node.js'
import { Pair } from './Pair.js'
import { Scalar } from './Scalar.js'
import { YAMLMap } from './YAMLMap.js'
import { YAMLSeq } from './YAMLSeq.js'

const BREAK = Symbol('break visit')
const SKIP = Symbol('skip children')
const REMOVE = Symbol('remove node')

function _visit(key, node, visitor, path) {
  let ctrl = undefined
  if (typeof visitor === 'function') ctrl = visitor(key, node, path)
  else if (node instanceof YAMLMap) {
    if (visitor.Map) ctrl = visitor.Map(key, node, path)
  } else if (node instanceof YAMLSeq) {
    if (visitor.Seq) ctrl = visitor.Seq(key, node, path)
  } else if (node instanceof Pair) {
    if (visitor.Pair) ctrl = visitor.Pair(key, node, path)
  } else if (node instanceof Scalar) {
    if (visitor.Scalar) ctrl = visitor.Scalar(key, node, path)
  } else if (node instanceof Alias) {
    if (visitor.Scalar) ctrl = visitor.Alias(key, node, path)
  }

  if (ctrl instanceof Node) {
    const parent = path[path.length - 1]
    if (parent instanceof YAMLMap || parent instanceof YAMLSeq) {
      parent.items[key] = ctrl
    } else if (parent instanceof Pair) {
      if (key === 'key') parent.key = ctrl
      else parent.value = ctrl
    } else if (parent && parent.type === Type.DOCUMENT) {
      parent.contents = ctrl
    } else {
      const pt = parent && parent.type
      throw new Error(`Cannot replace node with ${pt} parent`)
    }
    return _visit(key, ctrl, visitor, path)
  }

  if (typeof ctrl !== 'symbol') {
    if (node instanceof YAMLMap || node instanceof YAMLSeq) {
      path = Object.freeze(path.concat(node))
      for (let i = 0; i < node.items.length; ++i) {
        const ci = _visit(i, node.items[i], visitor, path)
        if (typeof ci === 'number') i = ci - 1
        else if (ci === BREAK) return BREAK
        else if (ci === REMOVE) {
          node.items.splice(i, 1)
          i -= 1
        }
      }
    } else if (node instanceof Pair) {
      path = Object.freeze(path.concat(node))
      const ck = _visit('key', node.key, visitor, path)
      if (ck === BREAK) return BREAK
      else if (ck === REMOVE) node.key = null
      const cv = _visit('value', node.value, visitor, path)
      if (cv === BREAK) return BREAK
      else if (cv === REMOVE) node.value = null
    }
  }

  return ctrl
}

export function visit(node, visitor) {
  if (node && node.type === Type.DOCUMENT) {
    const cd = _visit(null, node.contents, visitor, Object.freeze([node]))
    if (cd === REMOVE) node.contents = null
  } else _visit(null, node, visitor, Object.freeze([]))
}

visit.BREAK = BREAK
visit.SKIP = SKIP
visit.REMOVE = REMOVE
