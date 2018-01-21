import Node from './Node'
import Range from './Range'

export default class Collection extends Node {
  constructor (firstItem) {
    super({ type: Node.Type.COLLECTION })
    this.items = [firstItem]
  }

  /**
   * @param {ParseContext} context
   * @param {!number} start - Index of first character
   * @returns {!number} - Index of the character after this
   */
  parse (context, start) {
    trace: context, { start }
    this.context = context
    const { inFlow, parseNode, src } = context
    let { lineStart } = context
    const firstItem = this.items[0]
    this.valueRange = Range.copy(firstItem.valueRange)
    const indent = firstItem.valueRange.start - firstItem.context.lineStart
    let offset = start
    offset = Node.normalizeOffset(src, offset)
    let ch = src[offset]
    let atLineStart = false
    trace: 'items-start', { offset, indent, lineStart, ch: JSON.stringify(ch) }
    while (ch) {
      while (ch === '\n' || ch === '#') {
        if (ch === '#') {
          const comment = new Node({ type: Node.Type.COMMENT }, { src })
          offset = comment.parseComment(offset)
          this.items.push(comment)
          this.valueRange.end = comment.commentRange.end
          if (offset >= src.length) {
            ch = null
            break
          }
        }
        lineStart = offset + 1
        offset = Node.endOfIndent(src, lineStart)
        if (Node.atBlank(src, offset)) {
          const wsEnd = Node.endOfWhiteSpace(src, offset)
          const next = src[wsEnd]
          if (!next || next === '\n' || next === '#') {
            offset = wsEnd
          }
        }
        ch = src[offset]
        atLineStart = true
      }
      if (!ch) {
        trace: 'src-end', { offset }
        break
      }
      if (offset !== lineStart + indent && (atLineStart || ch !== ':')) {
        trace: 'unindent', { offset, lineStart, indent, ch: JSON.stringify(ch) }
        if (lineStart > start) offset = lineStart
        break
      }
      trace: 'item-start', this.items.length, { ch: JSON.stringify(ch) }
      const node = parseNode({ inCollection: true, inFlow, indent, lineStart, parent: this, src }, offset)
      if (!node) return offset // at next document start
      this.items.push(node)
      this.valueRange.end = node.valueRange.end
      if (node.range.end <= offset) throw new Error(`empty node ${node.type} ${JSON.stringify(node.range)}`)
      offset = Node.normalizeOffset(src, node.range.end)
      ch = src[offset]
      atLineStart = false
      trace: 'item-end', node.type, { offset, ch: JSON.stringify(ch) }
    }
    trace: 'items', this.items
    return offset
  }
}
