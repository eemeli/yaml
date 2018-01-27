import Node from './Node'
import Range from './Range'

export default class QuoteDouble extends Node {
  static endOfQuote (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '"') {
      offset += (ch === '\\') ? 2 : 1
      ch = src[offset]
    }
    return offset + 1
  }

  /**
   * Parses a "double quoted" value from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */
  parse (context, start) {
    this.context = context
    const { src } = context
    let offset = QuoteDouble.endOfQuote(src, start + 1)
    this.valueRange = new Range(start, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    trace: this.type, { valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    return offset
  }
}
