import Node from './Node'
import Range from './Range'

export default class BlockValue extends Node {
  static endOfBlockStyle (src, offset) {
    const valid = ['-', '+', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    let ch = src[offset]
    while (valid.indexOf(ch) !== -1) ch = src[offset += 1]
    return offset
  }

  constructor (doc, props) {
    super(doc, props)
    this.blockStyle = null
  }

  parseBlockValue (start, indent, inFlow) {
    const { src } = this.doc
    let offset = start
    for (let ch = src[offset]; ch === '\n'; ch = src[offset]) {
      offset += 1
      const end = Node.endOfBlockIndent(src, indent, offset)
      if (end === null) break
      offset = Node.endOfLine(src, end)
    }
    this.valueRange = new Range(start + 1, offset)
    return offset
  }

  /**
   * Parses a block value from the source
   *
   * Accepted forms are:
   * ```
   * BS
   * block
   * lines
   *
   * BS #comment
   * block
   * lines
   * ```
   * where the block style BS matches the regexp `[|>][-+1-9]*` and block lines
   * are empty or have an indent level greater than `indent`.
   *
   * @param {!number} start - Index of first character
   * @param {!number} indent - Current level of indentation
   * @param {boolean} inFlow - true if currently in a flow context
   * @returns {!number} - Index of the character after this block
   */
  parse (start, indent, inFlow) {
    trace: ({ start, indent, inFlow })
    const { src } = this.doc
    let offset = BlockValue.endOfBlockStyle(src, start + 1)
    this.blockStyle = src.slice(start, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    offset = this.parseBlockValue(offset, indent, inFlow)
    trace: this.type, { style: this.blockStyle, valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    return offset
  }
}
