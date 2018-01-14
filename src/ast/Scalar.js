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

  constructor (doc, props) {
    super(doc, props)
    this.blockStyle = null
  }

  parseInlineValue (start, inFlow) {
    const { src } = this.doc
    let end
    switch (this.type) {
      case Node.Type.ALIAS:
        start += 1
        end = Node.endOfIdentifier(src, start)
        break
      case Node.Type.DIRECTIVE:
        start += 1
        end = Scalar.endOfDirective(src, start)
        break
      case Node.Type.DOUBLE:
        end = Scalar.endOfDoubleQuote(src, start + 1)
        break
      case Node.Type.SINGLE:
        end = Scalar.endOfSingleQuote(src, start + 1)
        break
      case Node.Type.BLOCK:
        end = Scalar.endOfBlockStyle(src, start + 1)
        this.blockStyle = src.slice(start, end)
        break
      default: // Node.Type.PLAIN
        end = Scalar.endOfPlainLine(src, start, true, inFlow)
    }
    this.valueRange = new Range(start, end)
    LOG && console.log('value', { type: this.type, range: this.valueRange, value: this.rawValue })
    return Node.endOfWhiteSpace(src, end)
  }

  parseBlockValue (offset, indent, inFlow) {
    const { src } = this.doc
    const endOfLine = (this.type === Node.Type.BLOCK) ? (
      (offset) => Node.endOfLine(src, offset)
    ) : (this.type === Node.Type.PLAIN) ? (
      (offset) => Scalar.endOfPlainLine(src, offset, false, inFlow)
    ) : (
      null
    )
    let ch = src[offset]
    if (endOfLine && ch === '\n') {
      const start = offset + 1
      while (ch === '\n') {
        const end = Scalar.endOfBlockIndent(src, indent, offset + 1)
        if (end === null) break
        offset = endOfLine(end)
        ch = src[offset]
      }
      if (this.type === Node.Type.PLAIN) {
        if (offset > start) {
          if (this.valueRange.isEmpty) this.valueRange.start = start
          this.valueRange.end = offset
        }
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
