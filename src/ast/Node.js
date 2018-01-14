import Range from './Range'

export const LOG = false

export default class Node {
  static Type = {
    ALIAS: 'ALIAS',
    BLOCK: 'BLOCK',
    COMMENT: 'COMMENT',
    DIRECTIVE: 'DIRECTIVE',
    DOUBLE: 'DOUBLE',
    FLOW_MAP: 'FLOW_MAP',
    FLOW_SEQ: 'FLOW_SEQ',
    MAP: 'MAP',
    PLAIN: 'PLAIN',
    SEQ: 'SEQ',
    SINGLE: 'SINGLE'
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

  static endOfLine (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '\n') ch = src[offset += 1]
    return offset
  }

  static endOfWhiteSpace (src, offset) {
    let ch = src[offset]
    while (ch === '\t' || ch === ' ') ch = src[offset += 1]
    return offset
  }

  static isBlank (src, offset) {
    const ch = src[offset]
    return ch === '\n' || ch === '\t' || ch === ' '
  }

  static parseType (src, offset) {
    switch (src[offset]) {
      case '*':
        return Node.Type.ALIAS
      case '|':
      case '>':
        return Node.Type.BLOCK
      case '%': {
        const prev = src[offset - 1]
        return !prev || prev === '\n' ? Node.Type.DIRECTIVE : Node.Type.PLAIN
      }
      case '"':
        return Node.Type.DOUBLE
      case '{':
        return Node.Type.FLOW_MAP
      case '[':
        return Node.Type.FLOW_SEQ
      case '?':
      case ':':
        return Node.isBlank(src, offset + 1) ? Node.Type.MAP : Node.Type.PLAIN
      case '-':
        return Node.isBlank(src, offset + 1) ? Node.Type.SEQ : Node.Type.PLAIN
      case "'":
        return Node.Type.SINGLE
      default:
        return Node.Type.PLAIN
    }
  }

  // Anchor and tag are before type, which determines the node implementation
  // class; hence this intermediate object.
  static parseProps (src, offset) {
    const props = { anchor: null, tag: null, type: null, valueStart: null }
    offset = Node.endOfWhiteSpace(src, offset)
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

  parseComment (offset) {
    if (this.src[offset] === '#') {
      const start = offset + 1
      const end = Node.endOfLine(this.src, start)
      this.commentRange = new Range(start, end)
      LOG && console.log('comment', this.commentRange)
      return end
    }
    LOG && console.log('comment skip')
    return offset
  }

}
