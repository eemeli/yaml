import { toJSON } from './Collection'

export default class Scalar {
  constructor (value) {
    this.value = value
  }

  toJSON () {
    return toJSON(this.value)
  }

  toString () {
    return String(this.value)
  }
}
