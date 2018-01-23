import Node from './Node'
import Range from './Range'

export default class CollectionItem extends Node {
  constructor (props) {
    super(props)
    this.indicator = null
    this.item = null
  }

  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */
  parse (context, start) {
    this.context = context
    trace: 'item-start', context.pretty, { start }
    const { parseNode, src } = context
    let { atLineStart, lineStart } = context
    const indent = atLineStart ? start - lineStart : context.indent
    this.indicator = src[start] // '?' or ':' or '-'
    let offset = Node.endOfWhiteSpace(src, start + 1)
    // let itemIndent = offset - lineStart
    let ch = src[offset]
    while (ch === '\n' || ch === '#') {
      const next = offset + 1
      if (ch === '#') {
        offset = Node.endOfLine(src, next)
        if (this.commentRange) {
          this.commentRange.end = offset
        } else {
          this.commentRange = new Range(next, offset)
        }
      } else {
        atLineStart = true
        lineStart = next
        offset = Node.endOfWhiteSpace(src, next) // against spec, to match \t allowed after indicator
        // itemIndent = offset - lineStart
      }
      ch = src[offset]
    }
    trace: 'item-parse?', { offset, atLineStart, lineStart, indent, ch: ch && JSON.stringify(ch) }
    if (Node.nextNodeIsIndented(ch, offset - (lineStart + indent))) {
      this.item = parseNode({ atLineStart, inCollection: false, indent, lineStart, parent: this }, offset)
      if (this.item) offset = this.item.range.end
    } else if (lineStart > start + 1) {
      offset = lineStart - 1
    }
    const end = this.item ? this.item.valueRange.end : offset
    trace: 'item-end', { start, end, offset }
    this.valueRange = new Range(start, end)
    return offset
  }
}
