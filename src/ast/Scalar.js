import Node from './Node'
import Range from './Range'

export default class Scalar extends Node {
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

  /**
   * Parses a scalar value from the source
   *
   * Accepted forms are:
   * ```
   * @alias
   *
   * "double \"quoted\" string"
   *
   * 'single ''quoted'' string'
   * ```
   * where both forms of quoted string may extend across multiple rows
   * regardless of indentation, and each form may be followed by a
   * whitespace-separated #comment.
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */
  parse (context, start) {
    this.context = context
    const { src } = context
    let offset
    switch (this.type) {
      case Node.Type.ALIAS:
        start += 1
        offset = Node.endOfIdentifier(src, start)
        break
      case Node.Type.QUOTE_DOUBLE:
        offset = Scalar.endOfDoubleQuote(src, start + 1)
        break
      case Node.Type.QUOTE_SINGLE:
        offset = Scalar.endOfSingleQuote(src, start + 1)
        break
      default:
        this.error = new Error(`Unknown node type: ${JSON.stringify(this.type)}`)
        offset = start + 1
    }
    this.valueRange = new Range(start, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    trace: this.type, { valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    return offset
  }
}
