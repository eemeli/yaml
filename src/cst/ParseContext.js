import { YAMLSyntaxError } from '../errors'
import Alias from './Alias'
import BlockValue from './BlockValue'
import Collection from './Collection'
import CollectionItem from './CollectionItem'
import FlowCollection from './FlowCollection'
import Node, { Char, Type } from './Node'
import PlainValue from './PlainValue'
import QuoteDouble from './QuoteDouble'
import QuoteSingle from './QuoteSingle'
import Range from './Range'

/**
 * @param {boolean} atLineStart - Node starts at beginning of line
 * @param {boolean} inFlow - true if currently in a flow context
 * @param {boolean} inCollection - true if currently in a collection context
 * @param {number} indent - Current level of indentation
 * @param {number} lineStart - Start of the current line
 * @param {Node} parent - The parent of the node
 * @param {string} src - Source of the YAML document
 */
export default class ParseContext {
  static parseType(src, offset, inFlow) {
    switch (src[offset]) {
      case '*':
        return Type.ALIAS
      case '>':
        return Type.BLOCK_FOLDED
      case '|':
        return Type.BLOCK_LITERAL
      case '{':
        return Type.FLOW_MAP
      case '[':
        return Type.FLOW_SEQ
      case '?':
        return !inFlow && Node.atBlank(src, offset + 1)
          ? Type.MAP_KEY
          : Type.PLAIN
      case ':':
        return !inFlow && Node.atBlank(src, offset + 1)
          ? Type.MAP_VALUE
          : Type.PLAIN
      case '-':
        return !inFlow && Node.atBlank(src, offset + 1)
          ? Type.SEQ_ITEM
          : Type.PLAIN
      case '"':
        return Type.QUOTE_DOUBLE
      case "'":
        return Type.QUOTE_SINGLE
      default:
        return Type.PLAIN
    }
  }

  constructor(
    orig = {},
    { atLineStart, inCollection, inFlow, indent, lineStart, parent } = {}
  ) {
    this.atLineStart =
      atLineStart != null ? atLineStart : orig.atLineStart || false
    this.inCollection =
      inCollection != null ? inCollection : orig.inCollection || false
    this.inFlow = inFlow != null ? inFlow : orig.inFlow || false
    this.indent = indent != null ? indent : orig.indent
    this.lineStart = lineStart != null ? lineStart : orig.lineStart
    this.parent = parent != null ? parent : orig.parent || {}
    this.src = orig.src
    this.events = Object.assign(
      {
        onDocumentContentsEnd: () => {},
        onDocumentDirectivesEnd: () => {}
      },
      orig.events
    )
  }

  // for logging
  get pretty() {
    const obj = {
      start: `${this.lineStart} + ${this.indent}`,
      in: [],
      parent: this.parent.type
    }
    if (!this.atLineStart) obj.start += ' + N'
    if (this.inCollection) obj.in.push('collection')
    if (this.inFlow) obj.in.push('flow')
    return obj
  }

  nodeStartsCollection(node) {
    const { inCollection, inFlow, src } = this
    if (inCollection || inFlow) return false
    if (node instanceof CollectionItem) return true
    // check for implicit key
    let offset = node.range.end
    if (src[offset] === '\n' || src[offset - 1] === '\n') return false
    offset = Node.endOfWhiteSpace(src, offset)
    return src[offset] === ':'
  }

  // Anchor and tag are before type, which determines the node implementation
  // class; hence this intermediate step.
  parseProps(offset) {
    const { inFlow, parent, src } = this
    const props = []
    let lineHasProps = false
    offset = Node.endOfWhiteSpace(src, offset)
    let ch = src[offset]
    while (
      ch === Char.ANCHOR ||
      ch === Char.COMMENT ||
      ch === Char.TAG ||
      ch === '\n'
    ) {
      if (ch === '\n') {
        const lineStart = offset + 1
        const inEnd = Node.endOfIndent(src, lineStart)
        const indentDiff = inEnd - (lineStart + this.indent)
        const noIndicatorAsIndent =
          parent.type === Type.SEQ_ITEM && parent.context.atLineStart
        if (
          !Node.nextNodeIsIndented(src[inEnd], indentDiff, !noIndicatorAsIndent)
        )
          break
        this.atLineStart = true
        this.lineStart = lineStart
        lineHasProps = false
        offset = inEnd
      } else if (ch === Char.COMMENT) {
        const end = Node.endOfLine(src, offset + 1)
        props.push(new Range(offset, end))
        offset = end
      } else {
        let end = Node.endOfIdentifier(src, offset + 1)
        if (
          ch === Char.TAG &&
          src[end] === ',' &&
          /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+,\d\d\d\d(-\d\d){0,2}\/\S/.test(
            src.slice(offset + 1, end + 13)
          )
        ) {
          // Let's presume we're dealing with a YAML 1.0 domain tag here, rather
          // than an empty but 'foo.bar' private-tagged node in a flow collection
          // followed without whitespace by a plain string starting with a year
          // or date divided by something.
          end = Node.endOfIdentifier(src, end + 5)
        }
        props.push(new Range(offset, end))
        lineHasProps = true
        offset = Node.endOfWhiteSpace(src, end)
      }
      ch = src[offset]
    }
    // '- &a : b' has an anchor on an empty node
    if (lineHasProps && ch === ':' && Node.atBlank(src, offset + 1)) offset -= 1
    const type = ParseContext.parseType(src, offset, inFlow)
    trace: 'props', type, { props, offset }
    return { props, type, valueStart: offset }
  }

  /**
   * Parses a node from the source
   * @param {ParseContext} overlay
   * @param {number} start - Index of first non-whitespace character for the node
   * @returns {?Node} - null if at a document boundary
   */
  parseNode = (overlay, start) => {
    if (Node.atDocumentBoundary(this.src, start)) return null
    const context = new ParseContext(this, overlay)
    const { props, type, valueStart } = context.parseProps(start)
    trace: 'START', valueStart, type, props, context.pretty
    let node
    switch (type) {
      case Type.ALIAS:
        node = new Alias(type, props)
        break
      case Type.BLOCK_FOLDED:
      case Type.BLOCK_LITERAL:
        node = new BlockValue(type, props)
        break
      case Type.FLOW_MAP:
      case Type.FLOW_SEQ:
        node = new FlowCollection(type, props)
        break
      case Type.MAP_KEY:
      case Type.MAP_VALUE:
      case Type.SEQ_ITEM:
        node = new CollectionItem(type, props)
        break
      case Type.COMMENT:
      case Type.PLAIN:
        node = new PlainValue(type, props)
        break
      case Type.QUOTE_DOUBLE:
        node = new QuoteDouble(type, props)
        break
      case Type.QUOTE_SINGLE:
        node = new QuoteSingle(type, props)
        break
      default:
        node.error = new YAMLSyntaxError(
          node,
          `Unknown node type: ${JSON.stringify(type)}`
        )
        node.range = new Range(start, start + 1)
        return node
    }
    let offset = node.parse(context, valueStart)
    let nodeEnd = this.src[offset] === '\n' ? offset + 1 : offset
    if (nodeEnd <= start) {
      node.error = new Error(`Node#parse consumed no characters`)
      node.error.parseEnd = nodeEnd
      node.error.source = node
      nodeEnd = start + 1
    }
    node.range = new Range(start, nodeEnd)
    trace: node.type, node.range, JSON.stringify(node.rawValue)
    if (context.nodeStartsCollection(node)) {
      trace: 'collection-start'
      if (
        !node.error &&
        !context.atLineStart &&
        context.parent.type === Type.DOCUMENT
      ) {
        node.error = new YAMLSyntaxError(
          node,
          'Block collection must not have preceding content here (e.g. directives-end indicator)'
        )
      }
      const collection = new Collection(node)
      offset = collection.parse(new ParseContext(context), offset)
      collection.range = new Range(start, offset)
      trace: collection.type,
        collection.range,
        JSON.stringify(collection.rawValue)
      return collection
    }
    return node
  }
}
