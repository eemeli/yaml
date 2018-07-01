import { YAMLSemanticError } from '../errors'
import Node, { Type } from './Node'
import Range from './Range'

export default class CollectionItem extends Node {
  constructor(type, props) {
    super(type, props)
    this.node = null
  }

  /**
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this
   */
  parse(context, start) {
    this.context = context
    trace: 'item-start', context.pretty, { start }
    const { parseNode, src } = context
    let { atLineStart, lineStart } = context
    if (!atLineStart && this.type === Type.SEQ_ITEM)
      this.error = new YAMLSemanticError(
        this,
        'Sequence items must not have preceding content on the same line'
      )
    const indent = atLineStart ? start - lineStart : context.indent
    let offset = Node.endOfWhiteSpace(src, start + 1)
    let ch = src[offset]
    while (ch === '\n' || ch === '#') {
      const next = offset + 1
      if (ch === '#') {
        const end = Node.endOfLine(src, next)
        this.props.push(new Range(offset, end))
        offset = end
      } else {
        atLineStart = true
        lineStart = next
        offset = Node.endOfWhiteSpace(src, next) // against spec, to match \t allowed after indicator
      }
      ch = src[offset]
    }
    trace: 'item-parse?',
      {
        indentDiff: offset - (lineStart + indent),
        ch: ch && JSON.stringify(ch)
      }
    if (
      Node.nextNodeIsIndented(
        ch,
        offset - (lineStart + indent),
        this.type !== Type.SEQ_ITEM
      )
    ) {
      this.node = parseNode(
        { atLineStart, inCollection: false, indent, lineStart, parent: this },
        offset
      )
      if (this.node) offset = this.node.range.end
    } else if (lineStart > start + 1) {
      offset = lineStart - 1
    }
    const end = this.node ? this.node.valueRange.end : offset
    trace: 'item-end', { start, end, offset }
    this.valueRange = new Range(start, end)
    return offset
  }

  toString() {
    const {
      context: { src },
      node,
      range,
      value
    } = this
    if (value != null) return value
    const str = node
      ? src.slice(range.start, node.range.start) + String(node)
      : src.slice(range.start, range.end)
    return Node.addStringTerminator(src, range.end, str)
  }
}
