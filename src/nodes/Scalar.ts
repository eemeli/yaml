import type { BlockScalar, FlowScalar } from '../parse/cst.js'
import { SCALAR } from './identity.js'
import { NodeBase, Range } from './Node.js'
import { toJS, ToJSContext } from './toJS.js'

export const isScalarValue = (value: unknown) =>
  !value || (typeof value !== 'function' && typeof value !== 'object')

export declare namespace Scalar {
  interface Parsed extends Scalar {
    range: Range
    source: string
    srcToken?: FlowScalar | BlockScalar
  }

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

  /** The scalar style used for the node's string representation */
  declare type?: Scalar.Type

  constructor(value: T) {
    super(SCALAR)
    this.value = value
  }

  toJSON(arg?: any, ctx?: ToJSContext): any {
    return ctx?.keep ? this.value : toJS(this.value, arg, ctx)
  }

  toString() {
    return String(this.value)
  }
}
