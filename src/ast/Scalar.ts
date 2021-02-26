import { Type } from '../constants.js'
import { Node } from './Node.js'
import { toJS, ToJSContext } from './toJS.js'

export const isScalarValue = (value: unknown) =>
  !value || (typeof value !== 'function' && typeof value !== 'object')

export declare namespace Scalar {
  interface Parsed extends Scalar {
    range: [number, number]
    source: string
  }

  type Type =
    | Type.BLOCK_FOLDED
    | Type.BLOCK_LITERAL
    | Type.PLAIN
    | Type.QUOTE_DOUBLE
    | Type.QUOTE_SINGLE
}

export class Scalar<T = unknown> extends Node {
  value: T

  declare type?: Scalar.Type

  /**
   * By default (undefined), numbers use decimal notation.
   * The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
   * The YAML 1.1 schema also supports 'BIN' and 'TIME'
   */
  declare format?: string

  declare minFractionDigits?: number

  /** Set during parsing to the source string value */
  declare source?: string

  constructor(value: T) {
    super()
    this.value = value
  }

  toJSON(arg?: any, ctx?: ToJSContext) {
    return ctx && ctx.keep ? this.value : toJS(this.value, arg, ctx)
  }

  toString() {
    return String(this.value)
  }
}
