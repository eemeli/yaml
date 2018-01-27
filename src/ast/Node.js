import Range from './Range'

export const Type = {
  ALIAS: 'ALIAS',
  BLOCK_FOLDED: 'BLOCK_FOLDED',
  BLOCK_LITERAL: 'BLOCK_LITERAL',
  COMMENT: 'COMMENT',
  DIRECTIVE: 'DIRECTIVE',
  DOCUMENT: 'DOCUMENT',
  FLOW_MAP: 'FLOW_MAP',
  FLOW_SEQ: 'FLOW_SEQ',
  MAP: 'MAP',
  MAP_KEY: 'MAP_KEY',
  MAP_VALUE: 'MAP_VALUE',
  PLAIN: 'PLAIN',
  QUOTE_DOUBLE: 'QUOTE_DOUBLE',
  QUOTE_SINGLE: 'QUOTE_SINGLE',
  SEQ: 'SEQ',
  SEQ_ITEM: 'SEQ_ITEM'
}

export const Prop = {
  ANCHOR: '&',
  COMMENT: '#',
  TAG: '!'
}

/** Root class of all nodes */
export default class Node {
  static addStringTerminator (src, offset, str) {
    if (str[str.length - 1] === '\n') return str
    const next = Node.endOfWhiteSpace(src, offset)
    return next >= src.length || src[next] === '\n' ? str + '\n' : str
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

  static nextNodeIsIndented (ch, indentDiff, indicatorAsIndent) {
    if (!ch || indentDiff < 0) return false
    if (indentDiff > 0) return true
    return indicatorAsIndent && (ch === '-' || ch === '?' || ch === ':')
  }

  // should be at line or string end, or at next non-whitespace char
  static normalizeOffset (src, offset) {
    const ch = src[offset]
    return !ch ? offset
      : ch !== '\n' && src[offset - 1] === '\n' ? offset - 1
      : Node.endOfWhiteSpace(src, offset)
  }

  constructor (type, props, context) {
    this.context = context || null
    this.error = null
    this.range = null
    this.valueRange = null
    this.props = props || []
    this.type = type
    this.value = null
  }

  getPropValue (idx, key) {
    if (!this.context) return null
    const { src } = this.context
    const prop = this.props[idx]
    return prop && (src[prop.start] === key) ? src.slice(prop.start + 1, prop.end) : null
  }

  get anchor () {
    for (let i = 0; i < this.props.length; ++i) {
      const anchor = this.getPropValue(i, Prop.ANCHOR)
      if (anchor != null) return anchor
    }
    return null
  }

  get comment () {
    const comments = []
    for (let i = 0; i < this.props.length; ++i) {
      const comment = this.getPropValue(i, Prop.COMMENT)
      if (comment != null) comments.push(comment)
    }
    return comments.length > 0 ? comments.join('\n') : null
  }

  get hasComment () {
    if (this.context) {
      const { src } = this.context
      for (let i = 0; i < this.props.length; ++i) {
        if (src[this.props[i].start] === Prop.COMMENT) return true
      }
    }
    return false
  }

  get jsonLike () {
    const jsonLikeTypes = [
      Type.FLOW_MAP,
      Type.FLOW_SEQ,
      Type.QUOTE_DOUBLE,
      Type.QUOTE_SINGLE
    ]
    return jsonLikeTypes.indexOf(this.type) !== -1
  }

  get rawValue () {
    if (!this.valueRange || !this.context) return null
    const { start, end } = this.valueRange
    return this.context.src.slice(start, end)
  }

  get tag () {
    for (let i = 0; i < this.props.length; ++i) {
      const tag = this.getPropValue(i, Prop.TAG)
      if (tag != null) return tag
    }
    return null
  }

  parseComment (start) {
    const { src } = this.context
    if (src[start] === Prop.COMMENT) {
      const end = Node.endOfLine(src, start + 1)
      const commentRange = new Range(start, end)
      this.props.push(commentRange)
      trace: commentRange, JSON.stringify(this.getPropValue(this.props.length - 1, Prop.COMMENT))
      return end
    }
    return start
  }

  toString () {
    const { context: { src }, range, value } = this
    if (value != null) return value
    const str = src.slice(range.start, range.end)
    return Node.addStringTerminator(src, range.end, str)
  }
}
