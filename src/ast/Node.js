export const LOG = false

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

  get comment () {
    if (!this.src || !this.commentRange) return null
    const { start, end } = this.commentRange
    return this.src.slice(start, end)
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
    while (ch && ch !== '\n') ch = this.src[offset += 1]
    return offset
  }

  endWhiteSpace (offset) {
    let ch = this.src[offset]
    while (ch && (ch === '\t' || ch === ' ')) ch = this.src[offset += 1]
    return offset
  }

  parseComment (offset) {
    if (this.src[offset] === '#') {
      const start = offset + 1
      const end = this.endLine(start)
      this.commentRange = new Range(start, end)
      LOG && console.log('comment', this.commentRange)
      return end
    }
    LOG && console.log('comment skip')
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
      LOG && console.log('props', { prop, value: this[prop], offset, ch })
    }
    return offset
  }

}
