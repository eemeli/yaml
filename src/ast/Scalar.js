import Node, { LOG } from './Node'
import Range from './Range'

export default class Scalar extends Node {
  static endOfDirective (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '\n' && ch !== '#') ch = src[offset += 1]
    // last char can't be whitespace
    ch = src[offset - 1]
    while (ch === ' ' || ch === '\t') {
      offset -= 1
      ch = src[offset - 1]
    }
    return offset
  }

  static endOfDoubleQuote (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '"') {
      offset += (ch === '\\') ? 2 : 1
      ch = src[offset]
    }
    return offset + 1
  }

  static endOfSingleQuote (src, offset) {
    let ch = src[offset]
    while (ch) {
      if (ch === "'") {
        if (src[offset + 1] !== "'") break
        ch = src[offset += 2]
      } else {
        ch = src[offset += 1]
      }
    }
    return offset + 1
  }

  static endOfPlainLine (src, start, first, inFlow) {
    let ch = src[start]
    if (first) {
      if (ch === '#' || ch === '\n') return start
      if (ch === ':' || ch === '?' || ch === '-') {
        const next = src[start + 1]
        if (next === '\n' || next === '\t' || next === ' ') return start
      }
    }
    let offset = start
    while (ch && ch !== '\n') {
      if (inFlow && (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ',')) break
      const next = src[offset + 1]
      if (ch === ':' && (next === ' ' || next === '\t')) break
      if ((ch === ' ' || ch === '\t') && next === '#') break
      offset += 1
      ch = next
    }
    // last char can't be whitespace
    ch = src[offset - 1]
    while (offset > start && (ch === ' ' || ch === '\t')) {
      offset -= 1
      ch = src[offset - 1]
    }
    return offset
  }

  static endOfBlockStyle (src, offset) {
    const valid = ['-', '+', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    let ch = src[offset]
    while (valid.indexOf(ch) !== -1) ch = src[offset += 1]
    return offset
  }

  static endOfBlockIndent (src, indent, offset) {
    const inEnd = Node.endOfIndent(src, offset)
    if (inEnd > offset + indent) {
      return inEnd
    } else {
      const wsEnd = Node.endOfWhiteSpace(src, inEnd)
      if (src[wsEnd] === '\n') {
        return wsEnd
      }
    }
    return null
  }

  constructor (src, props) {
    super(src, props)
    this.blockStyle = null
  }

  parseInlineValue (start, inFlow) {
    let end
    switch (this.type) {
      case Node.Type.ALIAS:
        start += 1
        end = Node.endOfIdentifier(this.src, start)
        break
      case Node.Type.DIRECTIVE:
        start += 1
        end = Scalar.endOfDirective(this.src, start)
        break
      case Node.Type.DOUBLE:
        end = Scalar.endOfDoubleQuote(this.src, start + 1)
        break
      case Node.Type.SINGLE:
        end = Scalar.endOfSingleQuote(this.src, start + 1)
        break
      case Node.Type.BLOCK:
        end = Scalar.endOfBlockStyle(this.src, start + 1)
        this.blockStyle = this.src.slice(start, end)
        break
      default: // Node.Type.PLAIN
        end = Scalar.endOfPlainLine(this.src, start, true, inFlow)
    }
    this.valueRange = new Range(start, end)
    LOG && console.log('value', { type: this.type, range: this.valueRange, value: this.rawValue })
    return Node.endOfWhiteSpace(this.src, end)
  }

  parseBlockValue (offset, indent, inFlow) {
    const endOfLine = (this.type === Node.Type.BLOCK) ? (
      (offset) => Node.endOfLine(this.src, offset)
    ) : (this.type === Node.Type.PLAIN) ? (
      (offset) => Scalar.endOfPlainLine(this.src, offset, false, inFlow)
    ) : (
      null
    )
    let ch = this.src[offset]
    if (endOfLine && ch === '\n') {
      const start = offset + 1
      while (ch === '\n') {
        const end = Scalar.endOfBlockIndent(this.src, indent, offset + 1)
        if (end === null) break
        offset = endOfLine(end)
        ch = this.src[offset]
      }
      if (this.type === Node.Type.PLAIN && !this.valueRange.isEmpty) {
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
    LOG && console.log('scalar parse start', { offset, indent, inFlow })
    offset = this.parseInlineValue(offset, inFlow)
    offset = this.parseComment(offset)
    offset = this.parseBlockValue(offset, indent, inFlow)
    return offset
  }
}
