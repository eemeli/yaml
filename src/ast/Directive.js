import Node, { Type } from './Node'
import Range from './Range'

export default class Directive extends Node {
  static endOfDirective (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '\n' && ch !== '#') ch = src[offset += 1]
    // last char can't be whitespace
    ch = src[offset - 1]
    while (ch === ' ' || ch === '\t') {
      offset -= 1
      ch = src[offset - 1]
    }
    return offset
  }

  constructor () {
    super(Type.DIRECTIVE)
  }

  parse (context, start) {
    this.context = context
    const { src } = context
    let offset = Directive.endOfDirective(src, start + 1)
    this.valueRange = new Range(start + 1, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    this.range = new Range(start, offset)
    return offset
  }
}
