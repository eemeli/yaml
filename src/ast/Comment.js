import Node, { Type } from './Node'
import Range from './Range'

export default class Comment extends Node {
  constructor() {
    super(Type.COMMENT)
  }

  /**
   * Parses a comment line from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */
  parse(context, start) {
    this.context = context
    const { src } = context
    let offset = this.parseComment(start)
    this.range = new Range(start, offset)
    trace: this.type, this.range, this.comment
    return offset
  }
}
