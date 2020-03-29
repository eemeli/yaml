import { Document, Options, Tag } from './index'
import { CST } from './parse-cst'
import { Type } from './util'

export interface BinaryOptions {
  /**
   * The type of string literal used to stringify `!!binary` values.
   *
   * Default: `'BLOCK_LITERAL'`
   */
  defaultType: Scalar.Type
  /**
   * Maximum line width for `!!binary`.
   *
   * Default: `76`
   */
  lineWidth: number
}
export const binaryOptions: BinaryOptions

export interface BoolOptions {
  /**
   * String representation for `true`. With the core schema, use `'true' | 'True' | 'TRUE'`.
   *
   * Default: `'true'`
   */
  trueStr: string
  /**
   * String representation for `false`. With the core schema, use `'false' | 'False' | 'FALSE'`.
   *
   * Default: `'false'`
   */
  falseStr: string
}
export const boolOptions: BoolOptions

export interface IntOptions {
  /**
   * Whether integers should be parsed into BigInt values.
   *
   * Default: `false`
   */
  asBigInt: false
}
export const intOptions: IntOptions

export interface NullOptions {
  /**
   * String representation for `null`. With the core schema, use `'null' | 'Null' | 'NULL' | '~' | ''`.
   *
   * Default: `'null'`
   */
  nullStr: string
}
export const nullOptions: NullOptions

export interface StrOptions {
  /**
   * The default type of string literal used to stringify values
   *
   * Default: `'PLAIN'`
   */
  defaultType: Scalar.Type
  doubleQuoted: {
    /**
     * Whether to restrict double-quoted strings to use JSON-compatible syntax.
     *
     * Default: `false`
     */
    jsonEncoding: boolean
    /**
     * Minimum length to use multiple lines to represent the value.
     *
     * Default: `40`
     */
    minMultiLineLength: number
  }
  fold: {
    /**
     * Maximum line width (set to `0` to disable folding).
     *
     * Default: `80`
     */
    lineWidth: number
    /**
     * Minimum width for highly-indented content.
     *
     * Default: `20`
     */
    minContentWidth: number
  }
}
export const strOptions: StrOptions

export class Schema {
  /** Default: `'tag:yaml.org,2002:'` */
  static defaultPrefix: string
  static defaultTags: {
    /** Default: `'tag:yaml.org,2002:map'` */
    MAP: string
    /** Default: `'tag:yaml.org,2002:seq'` */
    SEQ: string
    /** Default: `'tag:yaml.org,2002:str'` */
    STR: string
  }
  constructor(options: Options)
  /**
   * Convert any value into a `Node` using this schema, recursively turning
   * objects into collectsions.
   *
   * @param wrapScalars If undefined or `true`, also wraps plain values in
   *   `Scalar` objects; if `false` and `value` is not an object, it will be
   *   returned directly.
   * @param tag Use to specify the collection type, e.g. `"!!omap"`. Note that
   *   this requires the corresponding tag to be available in this schema.
   */
  createNode(
    value: any,
    wrapScalars: boolean,
    tag?: string,
    ctx?: Schema.CreateNodeContext
  ): AST.Node
  merge: boolean
  name: 'core' | 'failsafe' | 'json' | 'yaml-1.1'
  sortMapEntries: ((a: Pair, b: Pair) => number) | null
  tags: Tag[]
}

export namespace Schema {
  interface CreateNodeContext {
    wrapScalars?: boolean
    [key: string]: any
  }
}

export class Scalar implements AST.Node {
  constructor(value: null | boolean | number | string)
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): any
  type?: Scalar.Type
  /**
   * By default (undefined), numbers use decimal notation.
   * The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
   */
  format?: 'BIN' | 'HEX' | 'OCT' | 'TIME'
  value: any
}
export namespace Scalar {
  type Type =
    | Type.BLOCK_FOLDED
    | Type.BLOCK_LITERAL
    | Type.PLAIN
    | Type.QUOTE_DOUBLE
    | Type.QUOTE_SINGLE
}

export class Pair implements AST.Node {
  constructor(key: any, value?: any)
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): object | Map<any, any>
  type: Pair.Type.PAIR | Pair.Type.MERGE_PAIR
  /** Always Node or null when parsed, but can be set to anything. */
  key: any
  /** Always Node or null when parsed, but can be set to anything. */
  value: any
  cstNode?: never // no corresponding cstNode
}
export namespace Pair {
  enum Type {
    PAIR = 'PAIR',
    MERGE_PAIR = 'MERGE_PAIR'
  }
}

export class YAMLMap implements AST.Node {
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): object | Map<any, any>
  type?: Type.FLOW_MAP | Type.MAP
  /** Array of Pair when parsed, but can be set to anything. */
  items: Array<Pair | AST.Merge>
  schema?: Schema
}

export class YAMLSeq implements AST.Node {
  toJSON(arg?: any, ctx?: AST.NodeToJsonContext): any[]
  type?: Type.FLOW_SEQ | Type.SEQ
  /** Array of Nodes or nulls when parsed, but can be set to anything. */
  items: any[]
}

export namespace AST {
  type AstNode = ScalarNode | CollectionNode | Alias

  type ScalarNode =
    | BlockFolded
    | BlockLiteral
    | PlainValue
    | QuoteDouble
    | QuoteSingle

  type CollectionNode = FlowMap | BlockMap | FlowSeq | BlockSeq

  interface Node {
    /** A comment on or immediately after this */
    comment?: string
    /** A comment before this */
    commentBefore?: string
    /** Only available when `keepCstNodes` is set to `true` */
    cstNode?: CST.Node
    /**
     * The [start, end] range of characters of the source parsed
     * into this node (undefined for pairs or if not parsed)
     */
    range?: [number, number]
    /** A blank line before this node and its commentBefore */
    spaceBefore?: boolean
    /** A fully qualified tag, if required */
    tag?: string
    /** A plain JS representation of this node */
    toJSON(arg?: any, ctx?: NodeToJsonContext): any
    /** The type of this node */
    type?: Type | Pair.Type
  }

  interface NodeToJsonContext {
    anchors?: any[]
    doc: Document
    keep?: boolean
    mapAsMap?: boolean
    maxAliasCount?: number
    onCreate?: (node: AST.Node) => void
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

  interface Alias extends Node {
    type: Type.ALIAS
    source: AstNode
    cstNode?: CST.Alias
  }

  interface Merge extends Pair {
    type: Pair.Type.MERGE_PAIR
    /** Always Scalar('<<'), defined by the type specification */
    key: PlainValue
    /** Always YAMLSeq<Alias(Map)>, stringified as *A if length = 1 */
    value: YAMLSeq
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
    items: Array<AstNode | Pair>
    cstNode?: CST.FlowSeq
  }

  interface BlockSeq extends YAMLSeq {
    type: Type.SEQ
    items: Array<AstNode | null>
    cstNode?: CST.Seq
  }
}
