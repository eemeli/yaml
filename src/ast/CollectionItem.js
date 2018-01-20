import Node from './Node'
import Range from './Range'

export default class CollectionItem extends Node {
  constructor (props) {
    super(props)
    this.indicator = null
    this.item = null
  }

  /**
   *
   * @param {!Object} context
   * @param {!number} start - Index of first character
   * @returns {!number} - Index of the character after this
   */
  parse (context, start) {
    this.context = context
    trace: context, { start }
    const { inFlow, src } = context
    let { indent } = context
    this.indicator = src[start] // ? or : or -
    let offset = Node.endOfWhiteSpace(src, start + 1)
    let lineStart = start - indent
    let itemIndent = offset - lineStart
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
        lineStart = offset
        offset = Node.endOfWhiteSpace(src, next) // against spec, to match \t allowed after indicator
        itemIndent = offset - lineStart
      }
      ch = src[offset]
    }
    if (ch && itemIndent > indent) {
      if (Node.atCollectionItem(src, offset)) indent = itemIndent
      this.item = this.context.parseNode(offset, indent, inFlow, false)
      offset = this.item.range.end
    } else if (lineStart > start + 1) {
      offset = lineStart - 1
    }
    const end = this.item ? this.item.valueRange.end : offset
    trace: ({ start, end, offset })
    this.valueRange = new Range(start, end)
    return offset
  }
}
