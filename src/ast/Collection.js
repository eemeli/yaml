import CollectionItem from './CollectionItem'
import Comment from './Comment'
import Node, { Type } from './Node'
import Range from './Range'

export default class Collection extends Node {
  constructor (firstItem) {
    super(firstItem.type === Type.SEQ_ITEM ? Type.SEQ : Type.MAP)
    this.items = [firstItem]
    for (let i = firstItem.props.length - 1; i >= 0; --i) {
      if (firstItem.props[i].start < firstItem.context.lineStart) {
        // props on previous line are assumed by the collection
        this.props = firstItem.props.slice(0, i + 1)
        firstItem.props = firstItem.props.slice(i + 1)
        const itemRange = firstItem.props[0] || firstItem.valueRange
        firstItem.range.start = itemRange.start
        break
      }
    }
  }

  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */
  parse (context, start) {
    trace: 'collection-start', context.pretty, { start }
    this.context = context
    const { parseNode, src } = context
    let { lineStart } = context
    const firstItem = this.items[0]
    this.valueRange = Range.copy(firstItem.valueRange)
    const indent = firstItem.range.start - firstItem.context.lineStart
    let offset = start
    offset = Node.normalizeOffset(src, offset)
    let ch = src[offset]
    let atLineStart = false
    trace: 'items-start', { offset, indent, lineStart, ch: JSON.stringify(ch) }
    while (ch) {
      while (ch === '\n' || ch === '#') {
        if (ch === '#') {
          const comment = new Comment()
          offset = comment.parse({ src }, offset)
          this.items.push(comment)
          this.valueRange.end = offset
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
        trace: 'end:src', { offset }
        break
      }
      if (offset !== lineStart + indent && (atLineStart || ch !== ':')) {
        trace: 'end:unindent', { offset, lineStart, indent, ch: JSON.stringify(ch) }
        if (lineStart > start) offset = lineStart
        break
      }
      if ((firstItem.type === Type.SEQ_ITEM) !== (ch === '-')) {
        let typeswitch = true
        if (ch === '-') {
          // map key may start with -, as long as it's followed by a non-whitespace char
          const next = src[offset + 1]
          typeswitch = !next || next === '\n' || next === '\t' || next === ' '
        }
        if (typeswitch) {
          trace: 'end:typeswitch', { offset, lineStart, indent, ch: JSON.stringify(ch) }
          if (lineStart > start) offset = lineStart
          break
        }
      }
      trace: 'item-start', this.items.length, { ch: JSON.stringify(ch) }
      const node = parseNode({ atLineStart, inCollection: true, indent, lineStart, parent: this }, offset)
      if (!node) return offset // at next document start
      this.items.push(node)
      this.valueRange.end = node.valueRange.end
      offset = Node.normalizeOffset(src, node.range.end)
      ch = src[offset]
      atLineStart = false
      trace: 'item-end', node.type, { offset, ch: JSON.stringify(ch) }
    }
    trace: 'items', this.items
    return offset
  }

  toString () {
    const { context: { src }, items, range, value } = this
    if (value != null) return value
    let str = src.slice(range.start, items[0].range.start) + String(items[0])
    for (let i = 1; i < items.length; ++i) {
      const item = items[i]
      const { atLineStart, indent } = item.context
      if (atLineStart) for (let i = 0; i < indent; ++i) str += ' '
      str += String(item)
    }
    return Node.addStringTerminator(src, range.end, str)
  }
}
