import { Type } from '../constants.js'
import { YAMLSemanticError } from '../errors.js'
import { BlankLine } from './BlankLine.js'
import { Node } from './Node.js'
import { Range } from './Range.js'

export class CollectionItem extends Node {
  constructor(type, props) {
    super(type, props)
    this.node = null
  }

  get includesTrailingLines() {
    return !!this.node && this.node.includesTrailingLines
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
    const inlineComment = ch === '#'
    const comments = []
    let blankLine = null
    while (ch === '\n' || ch === '#') {
      if (ch === '#') {
        const end = Node.endOfLine(src, offset + 1)
        comments.push(new Range(offset, end))
        offset = end
      } else {
        atLineStart = true
        lineStart = offset + 1
        const wsEnd = Node.endOfWhiteSpace(src, lineStart)
        if (src[wsEnd] === '\n' && comments.length === 0) {
          blankLine = new BlankLine()
          lineStart = blankLine.parse({ src }, lineStart)
        }
        offset = Node.endOfIndent(src, lineStart)
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
    } else if (ch && lineStart > start + 1) {
      offset = lineStart - 1
    }
    if (this.node) {
      if (blankLine) {
        // Only blank lines preceding non-empty nodes are captured. Note that
        // this means that collection item range start indices do not always
        // increase monotonically. -- eemeli/yaml#126
        const items = context.parent.items || context.parent.contents
        if (items) items.push(blankLine)
      }
      if (comments.length) Array.prototype.push.apply(this.props, comments)
      offset = this.node.range.end
    } else {
      if (inlineComment) {
        const c = comments[0]
        this.props.push(c)
        offset = c.end
      } else {
        offset = Node.endOfLine(src, start + 1)
      }
    }
    const end = this.node ? this.node.valueRange.end : offset
    trace: 'item-end', { start, end, offset }
    this.valueRange = new Range(start, end)
    return offset
  }

  setOrigRanges(cr, offset) {
    offset = super.setOrigRanges(cr, offset)
    return this.node ? this.node.setOrigRanges(cr, offset) : offset
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
