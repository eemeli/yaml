import Node from './Node'
import Range from './Range'

export default class QuoteSingle extends Node {
  static endOfQuote (src, offset) {
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
   * Parses a 'single quoted' value from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */
  parse (context, start) {
    this.context = context
    const { src } = context
    let offset = QuoteSingle.endOfQuote(src, start + 1)
    this.valueRange = new Range(start, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    trace: this.type, { valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    return offset
  }
}
