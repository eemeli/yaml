import { Node } from './Node.js'
import { toJS } from './toJS.js'

export const isScalarValue = value =>
  !value || (typeof value !== 'function' && typeof value !== 'object')

export class Scalar extends Node {
  constructor(value) {
    super()
    this.value = value
  }

  toJSON(arg, ctx) {
    return ctx && ctx.keep ? this.value : toJS(this.value, arg, ctx)
  }

  toString() {
    return String(this.value)
  }
}
