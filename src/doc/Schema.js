import { Pair } from '../ast/Pair.js'
import { schemas, tags } from '../tags/index.js'
import { createNode } from './createNode.js'
import { getSchemaTags } from './getSchemaTags.js'

const sortMapEntriesByKey = (a, b) =>
  a.key < b.key ? -1 : a.key > b.key ? 1 : 0

export class Schema {
  constructor({ customTags, merge, schema, sortMapEntries }) {
    this.merge = !!merge
    this.name = schema
    this.sortMapEntries =
      sortMapEntries === true ? sortMapEntriesByKey : sortMapEntries || null
    this.tags = getSchemaTags(schemas, tags, customTags, schema)
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
