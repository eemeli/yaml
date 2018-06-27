import Node from './Node'
import Range from './Range'

export default class Alias extends Node {
  /**
   * Parses an *alias from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */
  parse(context, start) {
    this.context = context
    const { src } = context
    let offset = Node.endOfIdentifier(src, start + 1)
    this.valueRange = new Range(start + 1, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    trace: this.type,
      { valueRange: this.valueRange, comment: this.comment },
      JSON.stringify(this.rawValue)
    return offset
  }
}
