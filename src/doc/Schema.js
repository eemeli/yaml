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
  constructor({ customTags, merge, resolveKnownTags, schema, sortMapEntries }, anchors) {
    this.merge = !!merge
    this.name = schema
    this.sortMapEntries =
      sortMapEntries === true ? sortMapEntriesByKey : sortMapEntries || null
    this.tags = getSchemaTags(schemas, tags, customTags, schema)
    this.knownTags = resolveKnownTags ? coreKnownTags : {}
    this.anchors = anchors
  }

  createNode(value, wrapScalars, tagName, ctx) {
    const aliasNodes = []
    if (!ctx || typeof ctx === 'function') {
      ctx = {
        aliasNodes,
        onTagObj: ctx,
        prevObjects: new Map(),
        schema: this,
        wrapScalars
      }
    } else if (typeof wrapScalars === 'boolean') ctx.wrapScalars = wrapScalars
    const node = createNode(value, tagName, ctx)
    for (const alias of aliasNodes) {
      if (!this.anchors)
        throw new ReferenceError(
          'Circular references require a document; use doc.schema.createNode()'
        )
      // With circular references, the source node is only resolved after all of
      // its child nodes are. This is why anchors are set only after all of the
      // nodes have been created.
      alias.source = alias.source.node
      let name = this.anchors.getName(alias.source)
      if (!name) {
        name = this.anchors.newName()
        this.anchors.map[name] = alias.source
      }
    }
    return node
  }

  createPair(key, value, ctx) {
    let wrapScalars = null
    if (typeof ctx === 'boolean') {
      wrapScalars = ctx
      ctx = undefined
    }
    const k = this.createNode(key, wrapScalars, null, ctx)
    const v = this.createNode(value, wrapScalars, null, ctx)
    return new Pair(k, v)
  }
}
