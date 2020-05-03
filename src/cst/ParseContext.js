import { Char, Type } from '../constants.js'
import { YAMLSyntaxError } from '../errors.js'
import { Alias } from './Alias.js'
import { BlockValue } from './BlockValue.js'
import { Collection } from './Collection.js'
import { CollectionItem } from './CollectionItem.js'
import { FlowCollection } from './FlowCollection.js'
import { Node } from './Node.js'
import { PlainValue } from './PlainValue.js'
import { QuoteDouble } from './QuoteDouble.js'
import { QuoteSingle } from './QuoteSingle.js'
import { Range } from './Range.js'

function createNewNode(type, props) {
  switch (type) {
    case Type.ALIAS:
      return new Alias(type, props)
    case Type.BLOCK_FOLDED:
    case Type.BLOCK_LITERAL:
      return new BlockValue(type, props)
    case Type.FLOW_MAP:
    case Type.FLOW_SEQ:
      return new FlowCollection(type, props)
    case Type.MAP_KEY:
    case Type.MAP_VALUE:
    case Type.SEQ_ITEM:
      return new CollectionItem(type, props)
    case Type.COMMENT:
    case Type.PLAIN:
      return new PlainValue(type, props)
    case Type.QUOTE_DOUBLE:
      return new QuoteDouble(type, props)
    case Type.QUOTE_SINGLE:
      return new QuoteSingle(type, props)
    /* istanbul ignore next */
    default:
      return null // should never happen
  }
}

/**
 * @param {boolean} atLineStart - Node starts at beginning of line
 * @param {boolean} inFlow - true if currently in a flow context
 * @param {boolean} inCollection - true if currently in a collection context
 * @param {number} indent - Current level of indentation
 * @param {number} lineStart - Start of the current line
 * @param {Node} parent - The parent of the node
 * @param {string} src - Source of the YAML document
 */
export class ParseContext {
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
        return !inFlow && Node.atBlank(src, offset + 1, true)
          ? Type.MAP_KEY
          : Type.PLAIN
      case ':':
        return !inFlow && Node.atBlank(src, offset + 1, true)
          ? Type.MAP_VALUE
          : Type.PLAIN
      case '-':
        return !inFlow && Node.atBlank(src, offset + 1, true)
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
    this.root = orig.root
    this.src = orig.src
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
    if (lineHasProps && ch === ':' && Node.atBlank(src, offset + 1, true))
      offset -= 1
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
    trace: 'START',
      { valueStart, type, props },
      {
        start: `${context.lineStart} + ${context.indent}`,
        atLineStart: context.atLineStart,
        inCollection: context.inCollection,
        inFlow: context.inFlow,
        parent: context.parent.type
      }
    const node = createNewNode(type, props)
    let offset = node.parse(context, valueStart)
    node.range = new Range(start, offset)
    /* istanbul ignore if */
    if (offset <= start) {
      // This should never happen, but if it does, let's make sure to at least
      // step one character forward to avoid a busy loop.
      node.error = new Error(`Node#parse consumed no characters`)
      node.error.parseEnd = offset
      node.error.source = node
      node.range.end = start + 1
    }
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
