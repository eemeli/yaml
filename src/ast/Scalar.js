import Node, { Range } from './Node'

export default class Scalar extends Node {
  static Type = {
    ALIAS: 'ALIAS',
    DOUBLE: 'DOUBLE',
    SINGLE: 'SINGLE',
    PLAIN: 'PLAIN',
    BLOCK: 'BLOCK'
  }

  constructor (src) {
    super(src)
    this.type = null
    this.blockStyle = null
  }

  endIdentifier (offset) {
    let ch = this.src[offset]
    while (ch && ch !== '\n' && ch !== '\t' && ch !== ' ') ch = this.src[offset += 1]
    return offset
  }

  endDoubleQuote (offset) {
    let ch = this.src[offset]
    while (ch && ch !== '"') {
      offset += (ch === '\\') ? 2 : 1
      ch = this.src[offset]
    }
    return offset + 1
  }

  endSingleQuote (offset) {
    let ch = this.src[offset]
    while (ch) {
      if (ch === "'") {
        if (this.src[offset + 1] !== "'") break
        ch = this.src[offset += 2]
      } else {
        ch = this.src[offset += 1]
      }
    }
    return offset + 1
  }

  endPlainLine (offset, first, inFlow) {
    let ch = this.src[offset]
    if (first) {
      if (ch === '#' || ch === '\n') return offset
      if (ch === ':' || ch === '?' || ch === '-') {
        const next = this.src[offset + 1]
        if (next === '\n' || next === '\t' || next === ' ') return offset
      }
    }
    while (ch && ch !== '\n') {
      if (inFlow && (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ',')) break
      const next = this.src[offset + 1]
      if (ch === ':' && (next === ' ' || next === '\t')) break
      if ((ch === ' ' || ch === '\t') && next === '#') break
    }
    return offset
  }

  endBlockIndent (indent, offset) {
    const inEnd = this.endIndent(offset)
    if (inEnd > offset + indent) {
      return inEnd
    } else {
      const wsEnd = this.endWhiteSpace(indentEnd)
      if (this.src[wsEnd] === '\n') {
        return wsEnd
      }
    }
    return null
  }

  parseInlineValue (offset, inFlow) {
    let start = offset
    let end
    switch (this.src[offset]) {
      case '*':
        this.type = Scalar.Type.ALIAS
        start += 1
        end = this.endIdentifier(offset)
        break
      case '"':
        this.type = Scalar.Type.DOUBLE
        end = this.endDoubleQuote(offset + 1)
        break
      case "'":
        this.type = Scalar.Type.SINGLE
        end = this.endSingleQuote(offset + 1)
        break
      case '|':
      case '>':
        this.type = Scalar.Type.BLOCK
        end = this.endIdentifier(offset)
        this.blockStyle = this.src.slice(offset, end)
        break
      default:
        this.type = Scalar.Type.PLAIN
        end = this.endPlainLine(offset, true, inFlow)
    }
    this.valueRange = new Range(start, end)
    return this.endWhiteSpace(end)
  }

  parseBlockValue (offset, indent, inFlow) {
    const endLine = (this.type === Scalar.Type.BLOCK) ? (
      (offset) => this.endLine(offset)
    ) : (this.type === Scalar.Type.PLAIN) ? (
      (offset) => this.endPlainLine(offset, false, inFlow)
    ) : (
      null
    )
    if (endLine) {
      const start = offset
      while (this.src[offset] === '\n') {
        const end = this.endBlockIndent(indent, offset + 1)
        if (end === null) break
        offset = endLine(end)
      }
      this.valueRange = new Range(start, offset)
    }
    return offset
  }

  /**
   * Parses a scalar value from the source, starting at `offset`
   * @param {!number} offset - Index of first character
   * @param {!number} indent - Current level of indentation
   * @param {boolean} inFlow - true if currently in a flow-in context
   * @returns {!number} - Index of the character after this scalar, may be `\n`
   */
  parse (offset, indent, inFlow) {
    // offset = this.endWhiteSpace(offset)
    const start = offset
    offset = this.parseProps(offset)
    offset = this.parseInlineValue(offset, inFlow)
    offset = this.parseComment(offset)
    offset = this.parseBlockValue(offset, indent, inFlow)
    this.nodeRange = new Range(start, offset)
    return offset
  }
}
