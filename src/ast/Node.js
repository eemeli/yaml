export class Range {
  constructor (start, end) {
    this.start = start
    this.end = end || start
  }
}

export default class Node {
  static Prop = {
    ANCHOR: 'ANCHOR',
    TAG: 'TAG'
  }

  constructor (src) {
    this.src = src
    this.nodeRange = null
    this.valueRange = null
    this.commentRange = null
    this.anchor = null
    this.tag = null
  }

  get rawValue () {
    if (!this.src || !this.valueRange) return null
    const { start, end } = this.valueRange
    return this.src.slice(start, end)
  }

  endIndent (offset) {
    let ch = this.src[offset]
    while (ch && ch === ' ') ch = this.src[offset += 1]
    return offset
  }

  endLine (offset) {
    let ch = this.src[offset]
    while (ch && ch === '\n') ch = this.src[offset += 1]
    return offset
  }

  endWhiteSpace (offset) {
    let ch = this.src[offset]
    while (ch && (ch === '\t' || ch === ' ')) ch = this.src[offset += 1]
    return offset
  }

  parseComment (offset) {
    if (this.src[offset] === '#') {
      this.commentRange = new Range(offset + 1, this.endLine(offset))
      return this.commentRange.end
    }
    return offset
  }

  parseProps (offset) {
    let ch = this.src[offset]
    while (ch === '&' || ch === '!') {
      const end = this.endIdentifier(offset)
      const prop = ch === '&' ? 'anchor' : 'tag'
      this[prop] = this.src.slice(offset + 1, end)
      offset = this.endWhiteSpace(end)
      ch = this.src[offset]
    }
    return offset
  }

}
