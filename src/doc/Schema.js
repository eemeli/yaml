import { Pair } from '../ast/Pair.js'
import { schemas, tags } from '../tags/index.js'
import { createNode } from './createNode.js'
import { getSchemaTags } from './getSchemaTags.js'

const sortMapEntriesByKey = (a, b) =>
  a.key < b.key ? -1 : a.key > b.key ? 1 : 0

const coreKnownTags = {
  'tag:yaml.org,2002:binary': tags.binary,
  'tag:yaml.org,2002:omap': tags.omap,
  'tag:yaml.org,2002:pairs': tags.pairs,
  'tag:yaml.org,2002:set': tags.set,
  'tag:yaml.org,2002:timestamp': tags.timestamp
}

export class Schema {
  constructor({ customTags, merge, resolveKnownTags, schema, sortMapEntries }) {
    this.merge = !!merge
    this.name = schema
    this.sortMapEntries =
      sortMapEntries === true ? sortMapEntriesByKey : sortMapEntries || null
    this.tags = getSchemaTags(schemas, tags, customTags, schema)
    this.knownTags = resolveKnownTags ? coreKnownTags : {}
  }

  createNode(value, wrapScalars, tagName, ctx) {
    const baseCtx = { schema: this, wrapScalars }
    const createCtx = ctx ? Object.assign(ctx, baseCtx) : baseCtx
    return createNode(value, tagName, createCtx)
  }

  createPair(key, value, ctx) {
    if (!ctx) ctx = { wrapScalars: true }
    const k = this.createNode(key, ctx.wrapScalars, null, ctx)
    const v = this.createNode(value, ctx.wrapScalars, null, ctx)
    return new Pair(k, v)
  }
}
