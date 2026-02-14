import type { BlockScalar, FlowScalar } from '../parse/cst.ts'
import { NodeBase } from './Node.ts'
import type { ToJSContext } from './toJS.ts'

export declare namespace Scalar {
  type BLOCK_FOLDED = 'BLOCK_FOLDED'
  type BLOCK_LITERAL = 'BLOCK_LITERAL'
  type PLAIN = 'PLAIN'
  type QUOTE_DOUBLE = 'QUOTE_DOUBLE'
  type QUOTE_SINGLE = 'QUOTE_SINGLE'

  type Type = BLOCK_FOLDED | BLOCK_LITERAL | PLAIN | QUOTE_DOUBLE | QUOTE_SINGLE
}

export class Scalar<T = unknown> extends NodeBase {
  static readonly BLOCK_FOLDED = 'BLOCK_FOLDED'
  static readonly BLOCK_LITERAL = 'BLOCK_LITERAL'
  static readonly PLAIN = 'PLAIN'
  static readonly QUOTE_DOUBLE = 'QUOTE_DOUBLE'
  static readonly QUOTE_SINGLE = 'QUOTE_SINGLE'

  value: T

  /** An optional anchor on this node. Used by alias nodes. */
  declare anchor?: string

  /**
   * By default (undefined), numbers use decimal notation.
   * The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
   * The YAML 1.1 schema also supports 'BIN' and 'TIME'
   */
  declare format?: string

  /** If `value` is a number, use this value when stringifying this node. */
  declare minFractionDigits?: number

  /** Set during parsing to the source string value */
  declare source?: string

  declare srcToken?: FlowScalar | BlockScalar

  /** The scalar style used for the node's string representation */
  declare type?: Scalar.Type

  constructor(value: T) {
    super()
    this.value = value
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
