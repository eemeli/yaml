import { isNode } from './identity.ts'
import type { Node } from './types.ts'

export const NOT_FOUND: unique symbol = Symbol('NOT_FOUND')

export function lookupNodeKey<E>(
  values: Map<unknown, E>,
  nodeKeys: WeakMap<Node, unknown>,
  node: Node | null,
  getNode: (entry: E) => unknown
): unknown {
  if (!node || values.size === 0) return NOT_FOUND
  const mk = nodeKeys.get(node)
  if (mk === undefined && !nodeKeys.has(node)) return NOT_FOUND
  const entry = values.get(mk)
  return entry && getNode(entry) === node ? mk : NOT_FOUND
}

export function indexNodeKey(
  nodeKeys: WeakMap<Node, unknown>,
  node: unknown,
  mk: unknown
): void {
  if (isNode(node)) nodeKeys.set(node, mk)
}
