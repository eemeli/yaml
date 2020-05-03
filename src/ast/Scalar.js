import { Node } from './Node'
import { toJSON } from './toJSON'

export class Scalar extends Node {
  constructor(value) {
    super()
    this.value = value
  }

  toJSON(arg, ctx) {
    return ctx && ctx.keep ? this.value : toJSON(this.value, arg, ctx)
  }

  toString() {
    return String(this.value)
  }
}
