import { Type } from '../constants.js'
import { Node } from './Node.js'
import { Range } from './Range.js'

export class BlankLine extends Node {
  constructor() {
    super(Type.BLANK_LINE)
  }

  /* istanbul ignore next */
  get includesTrailingLines() {
    // This is never called from anywhere, but if it were,
    // this is the value it should return.
    return true
  }

  /**
   * Parses a blank line from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first \n character
   * @returns {number} - Index of the character after this
   */
  parse(context, start) {
    this.context = context
    this.range = new Range(start, start + 1)
    trace: this.type, this.range
    return start + 1
  }
}
