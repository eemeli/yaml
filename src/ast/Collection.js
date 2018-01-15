import Node from './Node'
import Range from './Range'
import Scalar from './Scalar'

export default class Collection extends Node {
  constructor (doc, props) {
    super(doc, props)
    this.items = []
  }

  parse (start, indent, inFlow) {
    trace: ({ start, indent })
    const { src } = this.doc
    let offset = Node.endOfWhiteSpace(src, start)
    let ch = src[offset]
    let lineStart = start - indent
    let valueEnd = offset
    while (ch) {
      while (ch === '\n' || ch === '#') {
        if (ch === '#') {
          const comment = new Scalar(this.doc, { type: Node.Type.COMMENT })
          offset = comment.parse(offset, indent, true)
          this.items.push(comment)
          valueEnd = comment.commentRange.end
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
      const node = this.doc.parseNode(offset, indent, inFlow)
      this.items.push(node)
      valueEnd = node.valueRange.end
      // FIXME: prevents infinite loop
      if (node.range.end <= offset) throw new Error(`empty node ${node.type} ${JSON.stringify(node.range)}`)
      offset = Node.endOfWhiteSpace(src, node.range.end)
      ch = src[offset]
    }
    this.valueRange = new Range(start, valueEnd)
    trace: 'items', this.items
    return offset
  }
}
