import Node, { LOG } from './Node'
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
   * @param {boolean} inFlow - true if currently in a flow-in context
   * @returns {!number} - Index of the character after this node; may be `\n`
   */
  parseNode (start, indent, inFlow) {
    const props = Node.parseProps(this.src, start)
    let node
    switch (props.type) {
      default:
        node = new Scalar(this, props)
    }
    const end = node.parse(props.valueStart, indent, inFlow)
    node.range = new Range(start, end)
    LOG && console.log('node', node.type, node.range)
    return node
  }
}
