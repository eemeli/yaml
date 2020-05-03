import { Node } from './Node.js'
import { toJSON } from './toJSON.js'

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
