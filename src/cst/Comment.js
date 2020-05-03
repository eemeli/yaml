import { Type } from '../constants.js'
import { Node } from './Node.js'
import { Range } from './Range.js'

export class Comment extends Node {
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
    const offset = this.parseComment(start)
    this.range = new Range(start, offset)
    trace: this.type, this.range, this.comment
    return offset
  }
}
