import type { Document, DocValue } from '../doc/Document.ts'
import type { BlockScalar, FlowScalar } from '../parse/cst.ts'
import type { NodeBase, Range } from './Node.ts'
import type { ToJSContext } from './toJS.ts'
import type { MapLike } from './YAMLMap.ts'

export declare namespace Scalar {
  type BLOCK_FOLDED = 'BLOCK_FOLDED'
  type BLOCK_LITERAL = 'BLOCK_LITERAL'
  type PLAIN = 'PLAIN'
  type QUOTE_DOUBLE = 'QUOTE_DOUBLE'
  type QUOTE_SINGLE = 'QUOTE_SINGLE'

  type Type = BLOCK_FOLDED | BLOCK_LITERAL | PLAIN | QUOTE_DOUBLE | QUOTE_SINGLE
}

export class Scalar<T = unknown> implements NodeBase {
  static readonly BLOCK_FOLDED = 'BLOCK_FOLDED'
  static readonly BLOCK_LITERAL = 'BLOCK_LITERAL'
  static readonly PLAIN = 'PLAIN'
  static readonly QUOTE_DOUBLE = 'QUOTE_DOUBLE'
  static readonly QUOTE_SINGLE = 'QUOTE_SINGLE'

  value: T

  /** An optional anchor on this node. Used by alias nodes. */
  declare anchor?: string

  /** A comment on or immediately after this node. */
  declare comment?: string | null

  /** A comment before this node. */
  declare commentBefore?: string | null

  /**
   * By default (undefined), numbers use decimal notation.
   * The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
   * The YAML 1.1 schema also supports 'BIN' and 'TIME'
   */
  declare format?: string

  /** If `value` is a number, use this value when stringifying this node. */
  declare minFractionDigits?: number

  /**
   * The `[start, value-end, node-end]` character offsets for
   * the part of the source parsed into this node (undefined if not parsed).
   * The `value-end` and `node-end` positions are themselves not included in their respective ranges.
   */
  declare range?: Range | null

  /** A blank line before this node and its commentBefore */
  declare spaceBefore?: boolean

  /** The CST token that was composed into this node.  */
  declare srcToken?: FlowScalar | BlockScalar

  /** Set during parsing to the source string value */
  declare source?: string

  /** A fully qualified tag, if required */
  declare tag?: string

  /** The scalar style used for the node's string representation */
  declare type?: Scalar.Type

  /**
   * Customize the way that a key-value pair is resolved.
   * Used for YAML 1.1 !!merge << handling.
   */
  declare addToJSMap?: (
    doc: Document<DocValue, boolean>,
    ctx: ToJSContext | undefined,
    map: MapLike,
    value: unknown
  ) => void

  constructor(value: T) {
    this.value = value
  }

  /** Create a copy of this node.  */
  clone(): this {
    const copy: this = Object.create(
      Object.getPrototypeOf(this),
      Object.getOwnPropertyDescriptors(this)
    )
    if (this.range) copy.range = [...this.range]
    return copy
  }

  /** A plain JavaScript representation of this node. */
  toJS(_doc?: unknown, ctx?: ToJSContext): T {
    if (ctx && this.anchor) {
      ctx.anchors.set(this, { aliasCount: 0, count: 1, res: this.value })
    }
    return this.value
  }

  toString(): string {
    return String(this.value)
  }
}
