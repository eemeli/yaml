import Node, { LOG } from './Node'
import Range from './Range'

export default class FlowContainer extends Node {
  constructor (doc, props) {
    super(doc, props)
    this.items = null
  }

  parse (start, indent) {
    LOG && console.log('flow-container parse start', { start, indent })
    const { src } = this.doc
    let ch = src[start] // { or [
    this.items = [ch]
    let offset = Node.endOfWhiteSpace(src, start + 1)
    while (ch && ch !== ']' && ch !== '}') {
      switch (ch) {
        case '\n': {
          const lineStart = offset + 1
          offset = Node.endOfIndent(src, lineStart)
          indent = offset - lineStart
        } break
        case ',': {
          this.items.push(ch)
          offset += 1
        } break
        default: {
          const node = this.doc.parseNode(offset, indent, true)
          this.items.push(node)
          offset = node.range.end
        }
      }
      offset = Node.endOfWhiteSpace(src, offset)
      ch = src[offset]
    }
    this.valueRange = new Range(start, offset + 1)
    if (ch) {
      this.items.push(ch)
      offset = Node.endOfWhiteSpace(src, offset + 1)
      offset = this.parseComment(offset)
    }
    LOG && console.log('flow-container items', this.items)
    return offset
  }
}
