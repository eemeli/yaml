import { Type } from '../constants'
import { YAMLReferenceError } from '../errors'
import toJSON from '../toJSON'
import Collection from './Collection'
import Node from './Node'
import Pair from './Pair'

const getAliasDepth = (node, anchors) => {
  if (node instanceof Alias) {
    const anchor = anchors.find(a => a.node === node.source)
    return anchor.depth + 1
  } else if (node instanceof Collection) {
    let maxDepth = 0
    for (const item of node.items) {
      const depth = getAliasDepth(item, anchors)
      if (depth > maxDepth) maxDepth = depth
    }
    return maxDepth
  } else if (node instanceof Pair) {
    const keyDepth = getAliasDepth(node.key, anchors)
    const valDepth = getAliasDepth(node.value, anchors)
    return Math.max(keyDepth, valDepth)
  }
  return 0
}

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
    if (!ctx) return toJSON(this.source, arg, ctx)
    const { anchors, maxAliasDepth } = ctx
    const anchor = anchors.find(a => a.node === this.source)
    if (!anchor || !anchor.res) {
      const msg = 'This should not happen: Alias anchor was not resolved?'
      throw new YAMLReferenceError(this.cstNode, msg)
    }
    if (typeof maxAliasDepth === 'number' && maxAliasDepth >= 0) {
      anchor.depth = getAliasDepth(this.source, anchors)
      if (anchor.depth > maxAliasDepth) {
        const msg =
          'Excessive alias depth indicates a resource exhaustion attack'
        throw new YAMLReferenceError(this.cstNode, msg)
      }
    }
    return anchor.res
  }

  // Only called when stringifying an alias mapping key while constructing
  // Object output.
  toString(ctx) {
    return Alias.stringify(this, ctx)
  }
}
