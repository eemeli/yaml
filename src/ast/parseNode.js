import BlockValue from './BlockValue'
import Collection from './Collection'
import CollectionItem from './CollectionItem'
import FlowCollection from './FlowCollection'
import Node from './Node'
import PlainValue from './PlainValue'
import Range from './Range'
import Scalar from './Scalar'

/**
 * @typedef {Object} ParseContext
 * @param {boolean} atLineStart - Node starts at beginning of line
 * @param {boolean} inFlow - true if currently in a flow context
 * @param {boolean} inCollection - true if currently in a collection context
 * @param {number} indent - Current level of indentation
 * @param {number} lineStart - Start of the current line
 * @param {Node} parent - The parent of the node
 * @param {string} src - Source of the YAML document
 */

const parseType = (src, offset) => {
  switch (src[offset]) {
    case '*':
      return Node.Type.ALIAS
    case '>':
      return Node.Type.BLOCK_FOLDED
    case '|':
      return Node.Type.BLOCK_LITERAL
    case '"':
      return Node.Type.DOUBLE
    case '{':
      return Node.Type.FLOW_MAP
    case '[':
      return Node.Type.FLOW_SEQ
    case '?':
      return Node.atBlank(src, offset + 1) ? Node.Type.MAP_KEY : Node.Type.PLAIN
    case ':':
      return Node.atBlank(src, offset + 1) ? Node.Type.MAP_VALUE : Node.Type.PLAIN
    case '-':
      return Node.atBlank(src, offset + 1) ? Node.Type.SEQ_ITEM : Node.Type.PLAIN
    case "'":
      return Node.Type.SINGLE
    default:
      return Node.Type.PLAIN
  }
}

// Anchor and tag are before type, which determines the node implementation
// class; hence this intermediate object.
const parseProps  = (src, offset) => {
  const props = { anchor: null, tag: null, type: null }
  offset = Node.endOfWhiteSpace(src, offset)
  let ch = src[offset]
  while (ch === '&' || ch === '!') {
    const end = Node.endOfIdentifier(src, offset)
    const prop = ch === '&' ? 'anchor' : 'tag'
    props[prop] = src.slice(offset + 1, end)
    offset = Node.endOfWhiteSpace(src, end)
    ch = src[offset]
  }
  props.type = parseType(src, offset)
  trace: props, offset
  return { props, valueStart: offset }
}

const nodeStartsCollection = ({ inCollection, inFlow, src, parent }, node) => {
  if (inCollection || inFlow) return false
  if (node instanceof CollectionItem) return true
  if (parent.type === Node.Type.MAP_KEY) return false
  // check for implicit key
  let offset = node.range.end
  if (src[offset] === '\n') return false
  offset = Node.endOfWhiteSpace(src, offset)
  return src[offset] === ':'
}

/**
 * Parses a node from the source
 * @param {ParseContext} context
 * @param {number} start - Index of first non-whitespace character for the node
 * @returns {?Node} - null if at a document boundary
 */
export default function parseNode ({ atLineStart, inCollection, inFlow, indent, lineStart, parent, src }, start) {
  if (Node.atDocumentBoundary(src, start)) return null
  const { props, valueStart } = parseProps(src, start)
  trace: 'START', props, { inCollection, inFlow, indent, lineStart }
  let node
  switch (props.type) {
    case Node.Type.BLOCK_FOLDED:
    case Node.Type.BLOCK_LITERAL:
      node = new BlockValue(props)
      break
    case Node.Type.FLOW_MAP:
    case Node.Type.FLOW_SEQ:
      node = new FlowCollection(props)
      break
    case Node.Type.MAP_KEY:
    case Node.Type.MAP_VALUE:
    case Node.Type.SEQ_ITEM:
      node = new CollectionItem(props)
    break
    case Node.Type.COMMENT:
    case Node.Type.PLAIN:
      node = new PlainValue(props)
      break
    default:
      node = new Scalar(props)
  }
  const context = { atLineStart, inCollection, inFlow, indent, lineStart, parent, parseNode, src }
  let offset = node.parse(context, valueStart)
  node.range = new Range(start, offset)
  trace: node.type, { anchor: node.anchor, tag: node.tag, valueStart, indent, lineStart }, node.range, JSON.stringify(node.rawValue)
  if (nodeStartsCollection(context, node)) {
    trace: 'collection-start'
    const collection = new Collection(node)
    offset = collection.parse(context, node.range.end)
    collection.range = new Range(start, offset)
    trace: collection.type, collection.range, JSON.stringify(collection.rawValue)
    return collection
  }
  return node
}
