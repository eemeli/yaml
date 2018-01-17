import Node from './Node'
import Range from './Range'

export default class PlainValue extends Node {
  static endOfLine (src, start, inFlow) {
    let ch = src[start]
    let offset = start
    while (ch && ch !== '\n') {
      if (inFlow && (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ',')) break
      const next = src[offset + 1]
      if (ch === ':' && (next === ' ' || next === '\t')) break
      if ((ch === ' ' || ch === '\t') && next === '#') break
      offset += 1
      ch = next
    }
    return offset
  }

  // a plain value must not contain leading or trailing white space characters
  get rawValue () {
    return super.rawValue.trim()
  }

  parseBlockValue (start, indent, inFlow) {
    const { src } = this.doc
    let offset = start
    for (let ch = src[offset]; ch === '\n'; ch = src[offset]) {
      offset += 1
      const end = Node.endOfBlockIndent(src, indent, offset)
      if (end === null) break
      offset = PlainValue.endOfLine(src, end, false, inFlow)
    }
    trace: ({ start, offset, ch: JSON.stringify(src[offset]), origRange: this.valueRange }), JSON.stringify(this.rawValue)
    if (offset > start) {
      if (this.valueRange.isEmpty) this.valueRange.start = start
      this.valueRange.end = offset
    }
    trace: this.valueRange, JSON.stringify(this.rawValue)
    return offset
  }

  /**
   * Parses a plain value from the source
   *
   * Accepted forms are:
   * ```
   * #comment
   *
   * first line
   *
   * first line #comment
   *
   * first line
   * block
   * lines
   *
   * #comment
   * block
   * lines
   * ```
   * where block lines are empty or have an indent level greater than `indent`.
   *
   * @param {!number} start - Index of first character
   * @param {!number} indent - Current level of indentation
   * @param {boolean} inFlow - true if currently in a flow context
   * @returns {!number} - Index of the character after this scalar, may be `\n`
   */
  parse (start, indent, inFlow) {
    const { src } = this.doc
    let offset = start
    let ch = src[offset]
    if (ch && ch !== '#' && ch !== '\n') {
      offset = PlainValue.endOfLine(src, start, inFlow)
    }
    this.valueRange = new Range(start, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    trace: 'first line', { valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    if (!this.commentRange || this.valueRange.isEmpty) {
      offset = this.parseBlockValue(offset, indent, inFlow)
    }
    trace: this.type, { offset, valueRange: this.valueRange }, JSON.stringify(this.rawValue)
    return offset
  }
}
