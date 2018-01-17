import BlockValue from './BlockValue'
import Collection from './Collection'
import CollectionItem from './CollectionItem'
import FlowContainer from './FlowContainer'
import Node from './Node'
import PlainValue from './PlainValue'
import Range from './Range'
import Scalar from './Scalar'

export default class Document {
  /**
   *
   * @param {!string} src - Source of the YAML document
   */
  constructor (src) {
    this.src = src
  }

  /**
   * Parses the node's type and value from the source
   * @param {!number} start - Index of first non-whitespace character for the node
   * @param {!number} indent - Current level of indentation
   * @param {boolean} inFlow - true if currently in a flow context
   * @param {boolean} inCollection - true if currently in a collection context
   * @returns {!number} - Index of the character after this node; may be `\n`
   */
  parseNode (start, indent, inFlow, inCollection) {
    trace: '=== start', { start, indent, inFlow, inCollection }, JSON.stringify(this.src.slice(start))
    const { props, offset } = Node.parseProps(this.src, start)
    let node
    switch (props.type) {
      case Node.Type.BLOCK_FOLDED:
      case Node.Type.BLOCK_LITERAL:
        node = new BlockValue(this, props)
        break
      case Node.Type.FLOW_MAP:
      case Node.Type.FLOW_SEQ:
        node = new FlowContainer(this, props)
        break
      case Node.Type.MAP_KEY:
      case Node.Type.MAP_VALUE:
      case Node.Type.SEQ_ITEM: {
        const item = new CollectionItem(this, props)
        node = inCollection ? item : new Collection(item, offset)
      } break
      case Node.Type.COMMENT:
      case Node.Type.PLAIN:
        node = new PlainValue(this, props)
        break
      default:
        node = new Scalar(this, props)
    }
    const end = node.parse(offset, indent, inFlow)
    node.range = new Range(start, end)
    trace: node.type, { offset, indent, range: node.range }, JSON.stringify(node.rawValue)
    return node
  }
}
