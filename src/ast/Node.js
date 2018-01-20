import Range from './Range'

export default class Node {
  static Type = {
    ALIAS: 'ALIAS',
    BLOCK_FOLDED: 'BLOCK_FOLDED',
    BLOCK_LITERAL: 'BLOCK_LITERAL',
    COLLECTION: 'COLLECTION',
    COMMENT: 'COMMENT',
    DIRECTIVE: 'DIRECTIVE',
    DOUBLE: 'DOUBLE',
    FLOW_MAP: 'FLOW_MAP',
    FLOW_SEQ: 'FLOW_SEQ',
    MAP_KEY: 'MAP_KEY',
    MAP_VALUE: 'MAP_VALUE',
    PLAIN: 'PLAIN',
    SEQ_ITEM: 'SEQ_ITEM',
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

  /**
   * End of indentation, or null if the line's indent level is not more
   * than `indent`
   *
   * @param {string} src
   * @param {number} indent
   * @param {number} lineStart
   * @returns {?number}
   */
  static endOfBlockIndent (src, indent, lineStart) {
    const inEnd = Node.endOfIndent(src, lineStart)
    if (inEnd > lineStart + indent) {
      return inEnd
    } else {
      const wsEnd = Node.endOfWhiteSpace(src, inEnd)
      const ch = src[wsEnd]
      if (!ch || ch === '\n') return wsEnd
    }
    return null
  }

  static atBlank (src, offset) {
    const ch = src[offset]
    return ch === '\n' || ch === '\t' || ch === ' '
  }

  static atCollectionItem (src, offset) {
    const ch = src[offset]
    return (ch === '?' || ch === ':' || ch === '-') && Node.atBlank(src, offset + 1)
  }

  // should be at line or string end, or at next non-whitespace char
  static normalizeOffset (src, offset) {
    const ch = src[offset]
    return !ch ? offset
      : ch !== '\n' && src[offset - 1] === '\n' ? offset - 1
      : Node.endOfWhiteSpace(src, offset)
  }

  static parseType (src, offset) {
    switch (src[offset]) {
      case '*':
        return Node.Type.ALIAS
      case '>':
        return Node.Type.BLOCK_FOLDED
      case '|':
        return Node.Type.BLOCK_LITERAL
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
        return Node.atBlank(src, offset + 1) ? Node.Type.MAP_KEY : Node.Type.PLAIN
      case ':':
        return Node.atBlank(src, offset + 1) ? Node.Type.MAP_VALUE : Node.Type.PLAIN
      case '-':
        return Node.atBlank(src, offset + 1) ? Node.Type.SEQ_ITEM : Node.Type.PLAIN
      case "'":
        return Node.Type.SINGLE
      default:
        return Node.Type.PLAIN
    }
  }

  // Anchor and tag are before type, which determines the node implementation
  // class; hence this intermediate object.
  static parseProps (src, offset) {
    const props = { anchor: null, tag: null, type: null }
    offset = Node.endOfWhiteSpace(src, offset)
    let ch = src[offset]
    while (ch === '&' || ch === '!') {
      const end = Node.endOfIdentifier(src, offset)
      const prop = ch === '&' ? 'anchor' : 'tag'
      props[prop] = src.slice(offset + 1, end)
      offset = Node.endOfWhiteSpace(src, end)
      ch = src[offset]
    }
    props.type = Node.parseType(src, offset)
    trace: props, offset
    return { props, offset }
  }

  constructor (doc, { anchor, tag, type }) {
    this.doc = doc
    this.range = null
    this.valueRange = null
    this.commentRange = null
    this.anchor = anchor || null
    this.tag = tag || null
    this.type = type
  }

  get comment () {
    if (!this.commentRange) return null
    const { start, end } = this.commentRange
    return this.doc.src.slice(start, end)
  }

  get jsonLike () {
    const jsonLikeTypes = [
      Node.Type.DOUBLE,
      Node.Type.FLOW_MAP,
      Node.Type.FLOW_SEQ,
      Node.Type.SINGLE
    ]
    return jsonLikeTypes.indexOf(this.type) !== -1
  }

  get rawValue () {
    if (!this.valueRange) return null
    const { start, end } = this.valueRange
    return this.doc.src.slice(start, end)
  }

  parseComment (offset) {
    if (this.doc.src[offset] === '#') {
      const start = offset + 1
      const end = Node.endOfLine(this.doc.src, start)
      this.commentRange = new Range(start, end)
      trace: this.commentRange, this.doc.src.slice(this.commentRange.start, this.commentRange.end)
      return end
    }
    return offset
  }

}
