import { Type } from '../constants'
import { CST } from '../cst'
import { Schema } from '../doc/Schema'

export class Node {
  /** A comment on or immediately after this */
  comment?: string | null
  /** A comment before this */
  commentBefore?: string | null
  /** Only available when `keepCstNodes` is set to `true` */
  cstNode?: CST.Node
  /**
   * The [start, end] range of characters of the source parsed
   * into this node (undefined for pairs or if not parsed)
   */
  range?: [number, number] | null
  /** A blank line before this node and its commentBefore */
  spaceBefore?: boolean
  /** A fully qualified tag, if required */
  tag?: string
  /** A plain JS representation of this node */
  toJSON(arg?: any): any
  /** The type of this node */
  type?: Type | Pair.Type
}

export class Scalar extends Node {
  constructor(value: any)
  type?: Scalar.Type
  /**
   * By default (undefined), numbers use decimal notation.
   * The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
   */
  format?: 'BIN' | 'HEX' | 'OCT' | 'TIME'
  value: any
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): any
  toString(): string
}
export namespace Scalar {
  type Type =
    | Type.BLOCK_FOLDED
    | Type.BLOCK_LITERAL
    | Type.PLAIN
    | Type.QUOTE_DOUBLE
    | Type.QUOTE_SINGLE
}

export class Alias extends Node {
  type: Type.ALIAS
  source: Node
  cstNode?: CST.Alias
  toString(ctx: Schema.StringifyContext): string
}

export class Pair extends Node {
  constructor(key: any, value?: any)
  type: Pair.Type.PAIR | Pair.Type.MERGE_PAIR
  /** Always Node or null when parsed, but can be set to anything. */
  key: any
  /** Always Node or null when parsed, but can be set to anything. */
  value: any
  cstNode?: never // no corresponding cstNode
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): object | Map<any, any>
  toString(
    ctx?: Schema.StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}
export namespace Pair {
  enum Type {
    PAIR = 'PAIR',
    MERGE_PAIR = 'MERGE_PAIR'
  }
}

export class Merge extends Pair {
  type: Pair.Type.MERGE_PAIR
  /** Always Scalar('<<'), defined by the type specification */
  key: AST.PlainValue
  /** Always YAMLSeq<Alias(Map)>, stringified as *A if length = 1 */
  value: YAMLSeq
  toString(ctx?: Schema.StringifyContext, onComment?: () => void): string
}

export class Collection extends Node {
  type?: Type.MAP | Type.FLOW_MAP | Type.SEQ | Type.FLOW_SEQ | Type.DOCUMENT
  items: any[]
  schema?: Schema

  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  add(value: any): void
  addIn(path: Iterable<any>, value: any): void
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  delete(key: any): boolean
  deleteIn(path: Iterable<any>): boolean
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  get(key: any, keepScalar?: boolean): any
  getIn(path: Iterable<any>, keepScalar?: boolean): any
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  has(key: any): boolean
  hasIn(path: Iterable<any>): boolean
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(key: any, value: any): void
  setIn(path: Iterable<any>, value: any): void
}

export class YAMLMap extends Collection {
  type?: Type.FLOW_MAP | Type.MAP
  items: Array<Pair>
  hasAllNullValues(): boolean
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): object | Map<any, any>
  toString(
    ctx?: Schema.StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}

export class YAMLSeq extends Collection {
  type?: Type.FLOW_SEQ | Type.SEQ
  delete(key: number | string | Scalar): boolean
  get(key: number | string | Scalar, keepScalar?: boolean): any
  has(key: number | string | Scalar): boolean
  set(key: number | string | Scalar, value: any): void
  hasAllNullValues(): boolean
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): any[]
  toString(
    ctx?: Schema.StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}

export namespace AST {
  interface NodeToJsonContext {
    anchors?: any[]
    doc: Document
    keep?: boolean
    mapAsMap?: boolean
    maxAliasCount?: number
    onCreate?: (node: Node) => void
    [key: string]: any
  }

  interface BlockFolded extends Scalar {
    type: Type.BLOCK_FOLDED
    cstNode?: CST.BlockFolded
  }

  interface BlockLiteral extends Scalar {
    type: Type.BLOCK_LITERAL
    cstNode?: CST.BlockLiteral
  }

  interface PlainValue extends Scalar {
    type: Type.PLAIN
    cstNode?: CST.PlainValue
  }

  interface QuoteDouble extends Scalar {
    type: Type.QUOTE_DOUBLE
    cstNode?: CST.QuoteDouble
  }

  interface QuoteSingle extends Scalar {
    type: Type.QUOTE_SINGLE
    cstNode?: CST.QuoteSingle
  }

  interface FlowMap extends YAMLMap {
    type: Type.FLOW_MAP
    cstNode?: CST.FlowMap
  }

  interface BlockMap extends YAMLMap {
    type: Type.MAP
    cstNode?: CST.Map
  }

  interface FlowSeq extends YAMLSeq {
    type: Type.FLOW_SEQ
    items: Array<Node>
    cstNode?: CST.FlowSeq
  }

  interface BlockSeq extends YAMLSeq {
    type: Type.SEQ
    items: Array<Node | null>
    cstNode?: CST.Seq
  }
}
