import type { Alias, Pair, Scalar, YAMLMap, YAMLSeq } from './ast/index.js'

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
 * `Alias` and `Scalar` node.
 */
export declare const visit: visit

export type visitor<T> = (
  key: number | 'key' | 'value' | null,
  node: T,
  path: Node[]
) => void | symbol | number | Node

export interface visit {
  (
    node: Node | Document,
    visitor:
      | visitor<any>
      | {
          Alias?: visitor<Alias>
          Map?: visitor<YAMLMap>
          Pair?: visitor<Pair>
          Scalar?: visitor<Scalar>
          Seq?: visitor<YAMLSeq>
        }
  ): void

  /** Terminate visit traversal completely */
  BREAK: symbol

  /** Remove the current node */
  REMOVE: symbol

  /** Do not visit the children of the current node */
  SKIP: symbol
}
