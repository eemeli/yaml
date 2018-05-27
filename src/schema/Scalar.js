import { toJSON } from './Collection'
import Node from './Node'

export default class Scalar extends Node {
  constructor(value) {
    super()
    this.value = value
  }

  toJSON() {
    return toJSON(this.value)
  }

  toString() {
    return String(this.value)
  }
}
