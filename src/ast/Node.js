import Range from './Range'

export const LOG = false

export default class Node {
  static Prop = {
    ANCHOR: 'ANCHOR',
    TAG: 'TAG'
  }

  static Type = {
    ALIAS: 'ALIAS',
    DOUBLE: 'DOUBLE',
    SINGLE: 'SINGLE',
    PLAIN: 'PLAIN',
    BLOCK: 'BLOCK'
  }

  static endOfIdentifier (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '\n' && ch !== '\t' && ch !== ' ') ch = src[offset += 1]
    return offset
  }

  static endOfIndent (src, offset) {
    let ch = src[offset]
    while (ch === ' ') ch = src[offset += 1]
    return offset
  }

  static endOfWhiteSpace (src, offset) {
    let ch = src[offset]
    while (ch === '\t' || ch === ' ') ch = src[offset += 1]
    return offset
  }

  static parseType (src, offset) {
    switch (src[offset]) {
      case '*':
        return Node.Type.ALIAS
      case '"':
        return Node.Type.DOUBLE
      case "'":
        return Node.Type.SINGLE
      case '|':
      case '>':
        return Node.Type.BLOCK
      default:
        return Node.Type.PLAIN
    }
  }

  static parseProps (src, offset) {
    const props = { anchor: null, tag: null, type: null, valueStart: null }
    let ch = src[offset]
    while (ch === '&' || ch === '!') {
      const end = Node.endOfIdentifier(src, offset)
      const prop = ch === '&' ? 'anchor' : 'tag'
      props[prop] = src.slice(offset + 1, end)
      offset = Node.endOfWhiteSpace(src, end)
      ch = src[offset]
    }
    props.valueStart = offset
    props.type = Node.parseType(src, offset)
    LOG && console.log('props', props)
    return props
  }

  constructor (src, { anchor, tag, type }) {
    this.src = src
    this.nodeRange = null
    this.valueRange = null
    this.commentRange = null
    this.anchor = anchor
    this.tag = tag
    this.type = type
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

  endLine (offset) {
    let ch = this.src[offset]
    while (ch && ch !== '\n') ch = this.src[offset += 1]
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

}
