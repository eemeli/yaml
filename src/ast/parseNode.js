import BlockValue from './BlockValue'
import Collection from './Collection'
import CollectionItem from './CollectionItem'
import FlowContainer from './FlowContainer'
import Node from './Node'
import PlainValue from './PlainValue'
import Range from './Range'
import Scalar from './Scalar'

/**
 * Parses the node's type and value from the source
 * @param {NodeContext} context
 * @param {number} start - Index of first non-whitespace character for the node
 * @returns {number} - Index of the character after this node; may be `\n`
 */
export default function parseNode ({ src, indent, inFlow, inCollection }, start) {
  trace: '=== start', { start, indent, inFlow, inCollection }, JSON.stringify(src.slice(start))
  const { props, offset } = Node.parseProps(src, start)
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
