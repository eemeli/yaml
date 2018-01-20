import BlockValue from './BlockValue'
import Collection from './Collection'
import CollectionItem from './CollectionItem'
import FlowContainer from './FlowContainer'
import Node from './Node'
import PlainValue from './PlainValue'
import Range from './Range'
import Scalar from './Scalar'

const parseType = (src, offset) => {
  switch (src[offset]) {
    case '*':
      return Node.Type.ALIAS
    case '>':
      return Node.Type.BLOCK_FOLDED
    case '|':
      return Node.Type.BLOCK_LITERAL
    case '%': {
      const prev = src[offset - 1]
      return !prev || prev === '\n' ? Node.Type.DIRECTIVE : Node.Type.PLAIN
    }
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
  return { props, offset }
}

/**
 * Parses the node's type and value from the source
 * @param {NodeContext} context
 * @param {number} start - Index of first non-whitespace character for the node
 * @returns {number} - Index of the character after this node; may be `\n`
 */
export default function parseNode ({ src, indent, inFlow, inCollection }, start) {
  trace: '=== start', { start, indent, inFlow, inCollection }, JSON.stringify(src.slice(start))
  const { props, offset } = parseProps(src, start)
  let node
  switch (props.type) {
    case Node.Type.BLOCK_FOLDED:
    case Node.Type.BLOCK_LITERAL:
      node = new BlockValue(props)
      break
    case Node.Type.FLOW_MAP:
    case Node.Type.FLOW_SEQ:
      node = new FlowContainer(props)
      break
    case Node.Type.MAP_KEY:
    case Node.Type.MAP_VALUE:
    case Node.Type.SEQ_ITEM: {
      const item = new CollectionItem(props)
      node = inCollection ? item : new Collection(item, offset)
    } break
    case Node.Type.COMMENT:
    case Node.Type.PLAIN:
      node = new PlainValue(props)
      break
    default:
      node = new Scalar(props)
  }
  const context = { indent, inCollection, inFlow, src, parseNode }
  let end = node.parse(context, offset)
  node.range = new Range(start, end)
  trace: node.type, { offset, indent, range: node.range }, JSON.stringify(node.rawValue)
  return node
}
