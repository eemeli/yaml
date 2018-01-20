import Node from './Node'
import Range from './Range'

export default class Collection extends Node {
  constructor (firstItem, valueStart) {
    super(firstItem.doc, { type: Node.Type.COLLECTION })
    this.items = [firstItem]
    this.valueRange = new Range(valueStart)
  }

  parse (start, indent, inFlow) {
    trace: ({ start, indent })
    const { src } = this.doc
    const firstItem = this.items[0]
    let offset = firstItem.parse(start, indent, inFlow)
    firstItem.range = new Range(this.valueRange.start, offset)
    trace: 'first-item', firstItem.type, { start, indent, range: firstItem.range }, JSON.stringify(firstItem.rawValue)
    this.valueRange.end = firstItem.valueRange.end
    offset = Node.normalizeOffset(src, offset)
    let lineStart = start - indent
    let ch = src[offset]
    trace: 'items-start', { offset, lineStart, ch: JSON.stringify(ch) }
    while (ch) {
      while (ch === '\n' || ch === '#') {
        if (ch === '#') {
          const comment = new Node(this.doc, { type: Node.Type.COMMENT })
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
      }
      if (!ch) {
        trace: 'string-end', { offset }
        break
      }
      if (offset !== lineStart + indent) {
        trace: 'unindent', { offset, lineStart, indent }
        if (lineStart > start) offset = lineStart
        break
      }
      trace: 'item-start', this.items.length, { ch: JSON.stringify(ch) }
      const node = this.doc.parseNode(offset, indent, inFlow, true)
      this.items.push(node)
      this.valueRange.end = node.valueRange.end
      if (node.range.end <= offset) throw new Error(`empty node ${node.type} ${JSON.stringify(node.range)}`)
      offset = Node.normalizeOffset(src, node.range.end)
      ch = src[offset]
      trace: 'item-end', node.type, { offset, ch: JSON.stringify(ch) }
    }
    trace: 'items', this.items
    return offset
  }
}
