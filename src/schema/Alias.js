import toJSON from '../toJSON'
import Node from './Node'

export default class Alias extends Node {
  static default = true

  static stringify({ range, source }, { anchors, doc, implicitKey }) {
    const anchor = Object.keys(anchors).find(a => anchors[a] === source)
    if (anchor) return `*${anchor}${implicitKey ? ' ' : ''}`
    const msg = doc.anchors.getName(source)
      ? 'Alias node must be after source node'
      : 'Source node not found for alias node'
    throw new Error(`${msg} [${range}]`)
  }

  constructor(source) {
    super()
    this.source = source
  }

  set tag(t) {
    throw new Error('Alias nodes cannot have tags')
  }

  toJSON(arg, keep) {
    return toJSON(this.source, arg, keep)
  }
}
