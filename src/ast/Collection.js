import Node from './Node'
import Range from './Range'
import Scalar from './Scalar'

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
    this.valueRange.end = firstItem.valueRange.end
    let lineStart = start - indent
    let ch = src[offset]
    while (ch) {
      while (ch === '\n' || ch === '#') {
        if (ch === '#') {
          const comment = new Scalar(this.doc, { type: Node.Type.COMMENT })
          offset = comment.parse(offset, indent, true)
          this.items.push(comment)
          this.valueRange.end = comment.commentRange.end
          if (offset >= src.length) break
        }
        lineStart = offset + 1
        offset = Node.endOfIndent(src, lineStart)
        if (Node.isBlank(src, offset)) {
          const wsEnd = Node.endOfWhiteSpace(src, offset)
          const next = src[wsEnd]
          if (!next || next === '\n' || next === '#') {
            offset = next
          }
        }
        ch = src[offset]
      }
      if (!ch || offset !== lineStart + indent) break
      trace: 'item-start', this.items.length, ch
      const node = this.doc.parseNode(offset, indent, inFlow, true)
      this.items.push(node)
      this.valueRange.end = node.valueRange.end
      // FIXME: prevents infinite loop
      if (node.range.end <= offset) throw new Error(`empty node ${node.type} ${JSON.stringify(node.range)}`)
      offset = Node.endOfWhiteSpace(src, node.range.end)
      ch = src[offset]
    }
    trace: 'items', this.items
    return offset
  }
}
