export default class Range {
  constructor (start, end) {
    this.start = start
    this.end = end || start
  }

  get isEmpty () {
    return typeof this.start !== 'number' || !this.end || this.end <= this.start
  }

  get length () {
    return this.isEmpty ? 0 : this.end - this.start
  }
}
