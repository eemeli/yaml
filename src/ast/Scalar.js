import Node, { LOG, Range } from './Node'

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

  endPlainLine (start, first, inFlow) {
    let ch = this.src[start]
    if (first) {
      if (ch === '#' || ch === '\n') return start
      if (ch === ':' || ch === '?' || ch === '-') {
        const next = this.src[start + 1]
        if (next === '\n' || next === '\t' || next === ' ') return start
      }
    }
    let offset = start
    while (ch && ch !== '\n') {
      if (inFlow && (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ',')) break
      const next = this.src[offset + 1]
      if (ch === ':' && (next === ' ' || next === '\t')) break
      if ((ch === ' ' || ch === '\t') && next === '#') break
      offset += 1
      ch = next
    }
    // last char can't be whitespace
    ch = this.src[offset - 1]
    while (offset > start && (ch === ' ' || ch === '\t')) {
      offset -= 1
      ch = this.src[offset - 1]
    }
    return offset
  }

  endBlockStyle (offset) {
    const valid = ['-', '+', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    let ch = this.src[offset]
    while (valid.indexOf(ch) !== -1) ch = this.src[offset += 1]
    return offset
  }

  endBlockIndent (indent, offset) {
    const inEnd = this.endIndent(offset)
    if (inEnd > offset + indent) {
      return inEnd
    } else {
      const wsEnd = this.endWhiteSpace(inEnd)
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
        end = this.endBlockStyle(offset + 1)
        this.blockStyle = this.src.slice(offset, end)
        break
      default:
        this.type = Scalar.Type.PLAIN
        end = this.endPlainLine(offset, true, inFlow)
    }
    this.valueRange = new Range(start, end)
    LOG && console.log('value', { type: this.type, range: this.valueRange, value: this.rawValue })
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
    let ch = this.src[offset]
    if (endLine && ch === '\n') {
      const start = offset + 1
      while (ch === '\n') {
        const end = this.endBlockIndent(indent, offset + 1)
        if (end === null) break
        offset = endLine(end)
        ch = this.src[offset]
      }
      if (this.type === Scalar.Type.PLAIN && !this.valueRange.isEmpty) {
        if (offset > start) this.valueRange.end = offset
      } else {
        this.valueRange = new Range(start, offset)
      }
      LOG && console.log('block', { type: this.type, style: this.blockStyle, range: this.valueRange, value: this.rawValue })
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
    LOG && console.log('parse start', JSON.stringify(this.src))
    const start = offset
    offset = this.parseProps(offset)
    offset = this.parseInlineValue(offset, inFlow)
    offset = this.parseComment(offset)
    offset = this.parseBlockValue(offset, indent, inFlow)
    this.nodeRange = new Range(start, offset)
    LOG && console.log('parse end', this.nodeRange)
    return offset
  }
}
