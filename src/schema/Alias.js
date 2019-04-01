import { Type } from '../constants'
import toJSON from '../toJSON'
import Node from './Node'

export default class Alias extends Node {
  static default = true

  static stringify(
    { range, source },
    { anchors, doc, implicitKey, inStringifyKey }
  ) {
    let anchor = Object.keys(anchors).find(a => anchors[a] === source)
    if (!anchor && inStringifyKey)
      anchor = doc.anchors.getName(source) || doc.anchors.newName()
    if (anchor) return `*${anchor}${implicitKey ? ' ' : ''}`
    const msg = doc.anchors.getName(source)
      ? 'Alias node must be after source node'
      : 'Source node not found for alias node'
    throw new Error(`${msg} [${range}]`)
  }

  constructor(source) {
    super()
    this.source = source
    this.type = Type.ALIAS
  }

  set tag(t) {
    throw new Error('Alias nodes cannot have tags')
  }

  toJSON(arg, ctx) {
    const anchor =
      ctx && ctx.anchors && ctx.anchors.find(a => a.node === this.source)
    return (anchor && anchor.res) || toJSON(this.source, arg, ctx)
  }

  // Only called when stringifying an alias mapping key while constructing
  // Object output.
  toString(ctx) {
    return this.source.toString(ctx)
  }
}
