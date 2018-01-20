import Range from './Range'

  /**
   * @typedef {Object} NodeContext
   * @param {string} src - Source of the YAML document
   * @param {number} indent - Current level of indentation
   * @param {boolean} inFlow - true if currently in a flow context
   * @param {boolean} inCollection - true if currently in a collection context
   */

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
    if (ch0 !== '-' && ch0 !== '.') return false
    const ch1 = src[offset + 1]
    const ch2 = src[offset + 2]
    return ch1 === ch0 && ch2 === ch0
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

  constructor ({ anchor, tag, type }, context) {
    this.context = context || null
    this.range = null
    this.valueRange = null
    this.commentRange = null
    this.anchor = anchor || null
    this.tag = tag || null
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
