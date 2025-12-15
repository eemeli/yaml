import type { Document } from './doc/Document.ts'
import type { Alias } from './nodes/Alias.ts'
import {
  isAlias,
  isCollection,
  isDocument,
  isMap,
  isNode,
  isPair,
  isScalar,
  isSeq
} from './nodes/identity.ts'
import type { Node } from './nodes/Node.ts'
import type { Pair } from './nodes/Pair.ts'
import type { Scalar } from './nodes/Scalar.ts'
import type { YAMLMap } from './nodes/YAMLMap.ts'
import type { YAMLSeq } from './nodes/YAMLSeq.ts'

const BREAK = Symbol('break visit')
const SKIP = Symbol('skip children')
const REMOVE = Symbol('remove node')

export type visitorFn<T> = (
  key: number | 'key' | 'value' | null,
  node: T,
  path: readonly (Document | Node | Pair)[]
) => void | symbol | number | Node | Pair

export type visitor =
  | visitorFn<unknown>
  | {
      Alias?: visitorFn<Alias>
      Collection?: visitorFn<YAMLMap | YAMLSeq>
      Map?: visitorFn<YAMLMap>
      Node?: visitorFn<Alias | Scalar | YAMLMap | YAMLSeq>
      Pair?: visitorFn<Pair>
      Scalar?: visitorFn<Scalar>
      Seq?: visitorFn<YAMLSeq>
      Value?: visitorFn<Scalar | YAMLMap | YAMLSeq>
    }

export type asyncVisitorFn<T> = (
  key: number | 'key' | 'value' | null,
  node: T,
  path: readonly (Document | Node | Pair)[]
) =>
  | void
  | symbol
  | number
  | Node
  | Pair
  | Promise<void | symbol | number | Node | Pair>

export type asyncVisitor =
  | asyncVisitorFn<unknown>
  | {
      Alias?: asyncVisitorFn<Alias>
      Collection?: asyncVisitorFn<YAMLMap | YAMLSeq>
      Map?: asyncVisitorFn<YAMLMap>
      Node?: asyncVisitorFn<Alias | Scalar | YAMLMap | YAMLSeq>
      Pair?: asyncVisitorFn<Pair>
      Scalar?: asyncVisitorFn<Scalar>
      Seq?: asyncVisitorFn<YAMLSeq>
      Value?: asyncVisitorFn<Scalar | YAMLMap | YAMLSeq>
    }

/**
 * Apply a visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling a
 * `visitor` function with three arguments:
 *   - `key`: For sequence values and map `Pair`, the node's index in the
 *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
 *     `null` for the root node.
 *   - `node`: The current node.
 *   - `path`: The ancestry of the current node.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `undefined` (default): Do nothing and continue
 *   - `visit.SKIP`: Do not visit the children of this node, continue with next
 *     sibling
 *   - `visit.BREAK`: Terminate traversal completely
 *   - `visit.REMOVE`: Remove the current node, then continue with the next one
 *   - `Node`: Replace the current node, then continue by visiting it
 *   - `number`: While iterating the items of a sequence or map, set the index
 *     of the next step. This is useful especially if the index of the current
 *     node has changed.
 *
 * If `visitor` is a single function, it will be called with all values
 * encountered in the tree, including e.g. `null` values. Alternatively,
 * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
 * `Alias` and `Scalar` node. To define the same visitor function for more than
 * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
 * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
 * specific defined one will be used for each node.
 */
export const visit: {
  (node: Node | Document | null, visitor: visitor): void

  /** Terminate visit traversal completely */
  BREAK: symbol

  /** Do not visit the children of the current node */
  SKIP: symbol

  /** Remove the current node */
  REMOVE: symbol
} = function visit(node, visitor) {
  const visitor_ = initVisitor(visitor)
  if (isDocument(node)) {
    const cd = visit_(null, node.contents, visitor_, Object.freeze([node]))
    if (cd === REMOVE) node.contents = null
  } else visit_(null, node, visitor_, Object.freeze([]))
}

visit.BREAK = BREAK
visit.SKIP = SKIP
visit.REMOVE = REMOVE

function visit_(
  key: number | 'key' | 'value' | null,
  node: unknown,
  visitor: visitor,
  path: readonly (Document | Node | Pair)[]
): number | symbol | void {
  const ctrl = callVisitor(key, node, visitor, path)

  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl)
    return visit_(key, ctrl, visitor, path)
  }

  if (typeof ctrl !== 'symbol') {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node))
      for (let i = 0; i < node.items.length; ++i) {
        const ci = visit_(i, node.items[i], visitor, path)
        if (typeof ci === 'number') i = ci - 1
        else if (ci === BREAK) return BREAK
        else if (ci === REMOVE) {
          node.items.splice(i, 1)
          i -= 1
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node))
      const ck = visit_('key', node.key, visitor, path)
      if (ck === BREAK) return BREAK
      else if (ck === REMOVE) node.key = null
      const cv = visit_('value', node.value, visitor, path)
      if (cv === BREAK) return BREAK
      else if (cv === REMOVE) node.value = null
    }
  }

  return ctrl
}

/**
 * Apply an async visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling a
 * `visitor` function with three arguments:
 *   - `key`: For sequence values and map `Pair`, the node's index in the
 *     collection. Within a `Pair`, `'key'` or `'value'`, correspondingly.
 *     `null` for the root node.
 *   - `node`: The current node.
 *   - `path`: The ancestry of the current node.
 *
 * The return value of the visitor may be used to control the traversal:
 *   - `Promise`: Must resolve to one of the following values
 *   - `undefined` (default): Do nothing and continue
 *   - `visitAsync.SKIP`: Do not visit the children of this node,
 *     continue with next sibling
 *   - `visitAsync.BREAK`: Terminate traversal completely
 *   - `visitAsync.REMOVE`: Remove the current node,
 *     then continue with the next one
 *   - `Node`: Replace the current node, then continue by visiting it
 *   - `number`: While iterating the items of a sequence or map, set the index
 *     of the next step. This is useful especially if the index of the current
 *     node has changed.
 *
 * If `visitor` is a single function, it will be called with all values
 * encountered in the tree, including e.g. `null` values. Alternatively,
 * separate visitor functions may be defined for each `Map`, `Pair`, `Seq`,
 * `Alias` and `Scalar` node. To define the same visitor function for more than
 * one node type, use the `Collection` (map and seq), `Value` (map, seq & scalar)
 * and `Node` (alias, map, seq & scalar) targets. Of all these, only the most
 * specific defined one will be used for each node.
 */
export const visitAsync: {
  (node: Node | Document | null, visitor: asyncVisitor): Promise<void>

  /** Terminate visit traversal completely */
  BREAK: symbol

  /** Do not visit the children of the current node */
  SKIP: symbol

  /** Remove the current node */
  REMOVE: symbol
} = async function visitAsync(node, visitor) {
  const visitor_ = initVisitor(visitor)
  if (isDocument(node)) {
    const cd = await visitAsync_(
      null,
      node.contents,
      visitor_,
      Object.freeze([node])
    )
    if (cd === REMOVE) node.contents = null
  } else await visitAsync_(null, node, visitor_, Object.freeze([]))
}

visitAsync.BREAK = BREAK
visitAsync.SKIP = SKIP
visitAsync.REMOVE = REMOVE

async function visitAsync_(
  key: number | 'key' | 'value' | null,
  node: unknown,
  visitor: asyncVisitor,
  path: readonly (Document | Node | Pair)[]
): Promise<number | symbol | void> {
  const ctrl = await callVisitor(key, node, visitor, path)

  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl)
    return visitAsync_(key, ctrl, visitor, path)
  }

  if (typeof ctrl !== 'symbol') {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node))
      for (let i = 0; i < node.items.length; ++i) {
        const ci = await visitAsync_(i, node.items[i], visitor, path)
        if (typeof ci === 'number') i = ci - 1
        else if (ci === BREAK) return BREAK
        else if (ci === REMOVE) {
          node.items.splice(i, 1)
          i -= 1
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node))
      const ck = await visitAsync_('key', node.key, visitor, path)
      if (ck === BREAK) return BREAK
      else if (ck === REMOVE) node.key = null
      const cv = await visitAsync_('value', node.value, visitor, path)
      if (cv === BREAK) return BREAK
      else if (cv === REMOVE) node.value = null
    }
  }

  return ctrl
}

function initVisitor<V extends visitor | asyncVisitor>(visitor: V) {
  if (
    typeof visitor === 'object' &&
    (visitor.Collection || visitor.Node || visitor.Value)
  ) {
    return Object.assign(
      {
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      },
      visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      },
      visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      },
      visitor
    )
  }

  return visitor
}

function callVisitor(
  key: number | 'key' | 'value' | null,
  node: unknown,
  visitor: visitor,
  path: readonly (Document | Node | Pair)[]
): ReturnType<visitorFn<unknown>>
function callVisitor(
  key: number | 'key' | 'value' | null,
  node: unknown,
  visitor: asyncVisitor,
  path: readonly (Document | Node | Pair)[]
): ReturnType<asyncVisitorFn<unknown>>
function callVisitor(
  key: number | 'key' | 'value' | null,
  node: unknown,
  visitor: visitor | asyncVisitor,
  path: readonly (Document | Node | Pair)[]
): ReturnType<visitorFn<unknown>> | ReturnType<asyncVisitorFn<unknown>> {
  if (typeof visitor === 'function') return visitor(key, node, path)
  if (isMap(node)) return visitor.Map?.(key, node, path)
  if (isSeq(node)) return visitor.Seq?.(key, node, path)
  if (isPair(node)) return visitor.Pair?.(key, node, path)
  if (isScalar(node)) return visitor.Scalar?.(key, node, path)
  if (isAlias(node)) return visitor.Alias?.(key, node, path)
  return undefined
}

function replaceNode(
  key: number | 'key' | 'value' | null,
  path: readonly (Document | Node | Pair)[],
  node: Node | Pair
): number | symbol | void {
  const parent = path[path.length - 1]
  if (isCollection(parent)) {
    parent.items[key as number] = node
  } else if (isPair(parent)) {
    if (key === 'key') parent.key = node
    else parent.value = node
  } else if (isDocument(parent)) {
    parent.contents = node as Node
  } else {
    const pt = isAlias(parent) ? 'alias' : 'scalar'
    throw new Error(`Cannot replace node with ${pt} parent`)
  }
}
