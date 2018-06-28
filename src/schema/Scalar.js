// Published as 'yaml/scalar'

import toJSON from '../toJSON'
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
