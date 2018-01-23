import Range from './Range'

/** Root class of all nodes */
export default class Node {
  static Type = {
    ALIAS: 'ALIAS',
    BLOCK_FOLDED: 'BLOCK_FOLDED',
    BLOCK_LITERAL: 'BLOCK_LITERAL',
    COLLECTION: 'COLLECTION',
    COMMENT: 'COMMENT',
    DIRECTIVE: 'DIRECTIVE',
    DOCUMENT: 'DOCUMENT',
    DOUBLE: 'DOUBLE',
    FLOW_MAP: 'FLOW_MAP',
    FLOW_SEQ: 'FLOW_SEQ',
    MAP_KEY: 'MAP_KEY',
    MAP_VALUE: 'MAP_VALUE',
    PLAIN: 'PLAIN',
    SEQ_ITEM: 'SEQ_ITEM',
    SINGLE: 'SINGLE'
  }

  // ^(---|...)
  static atDocumentBoundary (src, offset) {
    const prev = src[offset - 1]
    if (prev && prev !== '\n') return false
    const ch0 = src[offset]
    if (!ch0) return true
    if (ch0 !== '-' && ch0 !== '.') return false
    const ch1 = src[offset + 1]
    const ch2 = src[offset + 2]
    return ch1 === ch0 && ch2 === ch0
  }

  static endOfIdentifier (src, offset) {
    let ch = src[offset]
    const isVerbatim = (ch === '<')
    const notOk = isVerbatim
      ? ['\n', '\t', ' ', '>']
      : ['\n', '\t', ' ', '[', ']', '{', '}', ',']
    while (ch && notOk.indexOf(ch) === -1) ch = src[offset += 1]
    if (isVerbatim && ch === '>') offset += 1
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

  static nextNodeIsIndented (ch, indentDiff) {
    if (!ch || indentDiff < 0) return false
    if (indentDiff > 0) return true
    return ch === '-' || ch === '?' || ch === ':'
  }

  // should be at line or string end, or at next non-whitespace char
  static normalizeOffset (src, offset) {
    const ch = src[offset]
    return !ch ? offset
      : ch !== '\n' && src[offset - 1] === '\n' ? offset - 1
      : Node.endOfWhiteSpace(src, offset)
  }

  constructor ({ anchor, tag, type }, context) {
    this.context = context || null
    this.range = null
    this.valueRange = null
    this.commentRange = null
    this.anchor = anchor || null
    this.tag = typeof tag === 'string' ? tag : null
    this.type = type
  }

  get comment () {
    if (!this.commentRange || !this.context) return null
    const { start, end } = this.commentRange
    return this.context.src.slice(start, end)
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
    if (!this.valueRange || !this.context) return null
    const { start, end } = this.valueRange
    return this.context.src.slice(start, end)
  }

  parseComment (offset) {
    const { src } = this.context
    if (src[offset] === '#') {
      const start = offset + 1
      const end = Node.endOfLine(src, start)
      this.commentRange = new Range(start, end)
      trace: this.commentRange, src.slice(this.commentRange.start, this.commentRange.end)
      return end
    }
    return offset
  }

}
