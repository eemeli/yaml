// Published as 'yaml/scalar'

import toJSON from '../toJSON'
import Node from './Node'

export default class Scalar extends Node {
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
