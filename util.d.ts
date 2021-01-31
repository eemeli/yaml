import { Document } from '.'
import { CST } from './cst'
import { Node, Pair, Scalar, Schema, YAMLMap, YAMLSeq } from './types'

export function findPair(items: any[], key: Scalar | any): Pair | undefined

export function stringifyNumber(item: Scalar): string
export function stringifyString(
  item: Scalar,
  ctx: Schema.StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string

export function toJS(value: any, arg?: any, ctx?: Schema.CreateNodeContext): any

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
          Map?: visitor<YAMLMap>
          Pair?: visitor<Pair>
          Seq?: visitor<YAMLSeq>
          Scalar?: visitor<Scalar>
        }
  ): void

  /** Terminate visit traversal completely */
  BREAK: symbol

  /** Remove the current node */
  REMOVE: symbol

  /** Do not visit the children of the current node */
  SKIP: symbol
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
 * separate visitor functions may be defined for each `Map`, `Pair`, `Seq` and
 * `Scalar` node.
 */
export declare const visit: visit

export enum Type {
  ALIAS = 'ALIAS',
  BLANK_LINE = 'BLANK_LINE',
  BLOCK_FOLDED = 'BLOCK_FOLDED',
  BLOCK_LITERAL = 'BLOCK_LITERAL',
  COMMENT = 'COMMENT',
  DIRECTIVE = 'DIRECTIVE',
  DOCUMENT = 'DOCUMENT',
  FLOW_MAP = 'FLOW_MAP',
  FLOW_SEQ = 'FLOW_SEQ',
  MAP = 'MAP',
  MAP_KEY = 'MAP_KEY',
  MAP_VALUE = 'MAP_VALUE',
  PLAIN = 'PLAIN',
  QUOTE_DOUBLE = 'QUOTE_DOUBLE',
  QUOTE_SINGLE = 'QUOTE_SINGLE',
  SEQ = 'SEQ',
  SEQ_ITEM = 'SEQ_ITEM'
}

interface LinePos {
  line: number
  col: number
}

export class YAMLError extends Error {
  name:
    | 'YAMLReferenceError'
    | 'YAMLSemanticError'
    | 'YAMLSyntaxError'
    | 'YAMLWarning'
  message: string
  source?: CST.Node

  nodeType?: Type
  range?: CST.Range
  linePos?: { start: LinePos; end: LinePos }

  /**
   * Drops `source` and adds `nodeType`, `range` and `linePos`, as well as
   * adding details to `message`. Run automatically for document errors if
   * the `prettyErrors` option is set.
   */
  makePretty(): void
}

export class YAMLReferenceError extends YAMLError {
  name: 'YAMLReferenceError'
}

export class YAMLSemanticError extends YAMLError {
  name: 'YAMLSemanticError'
}

export class YAMLSyntaxError extends YAMLError {
  name: 'YAMLSyntaxError'
}

export class YAMLWarning extends YAMLError {
  name: 'YAMLWarning'
}
