import { Type } from '../constants'
import { YAMLReferenceError } from '../errors'
import { toJSON } from '../toJSON'
import { Collection } from './Collection'
import { Node } from './Node'
import { Pair } from './Pair'

const getAliasCount = (node, anchors) => {
  if (node instanceof Alias) {
    const anchor = anchors.get(node.source)
    return anchor.count * anchor.aliasCount
  } else if (node instanceof Collection) {
    let count = 0
    for (const item of node.items) {
      const c = getAliasCount(item, anchors)
      if (c > count) count = c
    }
    return count
  } else if (node instanceof Pair) {
    const kc = getAliasCount(node.key, anchors)
    const vc = getAliasCount(node.value, anchors)
    return Math.max(kc, vc)
  }
  return 1
}

export class Alias extends Node {
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
    const { anchors, maxAliasCount } = ctx
    const anchor = anchors.get(this.source)
    /* istanbul ignore if */
    if (!anchor || anchor.res === undefined) {
      const msg = 'This should not happen: Alias anchor was not resolved?'
      if (this.cstNode) throw new YAMLReferenceError(this.cstNode, msg)
      else throw new ReferenceError(msg)
    }
    if (maxAliasCount >= 0) {
      anchor.count += 1
      if (anchor.aliasCount === 0)
        anchor.aliasCount = getAliasCount(this.source, anchors)
      if (anchor.count * anchor.aliasCount > maxAliasCount) {
        const msg =
          'Excessive alias count indicates a resource exhaustion attack'
        if (this.cstNode) throw new YAMLReferenceError(this.cstNode, msg)
        else throw new ReferenceError(msg)
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
