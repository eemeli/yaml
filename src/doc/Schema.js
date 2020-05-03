import { Pair } from '../ast/Pair'
import { defaultTagPrefix, defaultTags } from '../constants'
import { schemas, tags } from '../tags'
import { warnOptionDeprecation } from '../warnings'
import { createNode } from './createNode'

export class Schema {
  static defaultPrefix = defaultTagPrefix // TODO: remove in v2
  static defaultTags = defaultTags // TODO: remove in v2

  constructor({
    customTags,
    merge,
    schema,
    sortMapEntries,
    tags: deprecatedCustomTags
  }) {
    this.merge = !!merge
    this.name = schema
    this.sortMapEntries =
      sortMapEntries === true
        ? (a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
        : sortMapEntries || null
    this.tags = schemas[schema.replace(/\W/g, '')] // 'yaml-1.1' -> 'yaml11'
    if (!this.tags) {
      const keys = Object.keys(schemas)
        .map(key => JSON.stringify(key))
        .join(', ')
      throw new Error(`Unknown schema "${schema}"; use one of ${keys}`)
    }
    if (!customTags && deprecatedCustomTags) {
      customTags = deprecatedCustomTags
      warnOptionDeprecation('tags', 'customTags')
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags) this.tags = this.tags.concat(tag)
    } else if (typeof customTags === 'function') {
      this.tags = customTags(this.tags.slice())
    }
    for (let i = 0; i < this.tags.length; ++i) {
      const tag = this.tags[i]
      if (typeof tag === 'string') {
        const tagObj = tags[tag]
        if (!tagObj) {
          const keys = Object.keys(tags)
            .map(key => JSON.stringify(key))
            .join(', ')
          throw new Error(`Unknown custom tag "${tag}"; use one of ${keys}`)
        }
        this.tags[i] = tagObj
      }
    }
  }

  createNode(value, wrapScalars, tagName, ctx) {
    const baseCtx = {
      defaultPrefix: Schema.defaultPrefix,
      schema: this,
      wrapScalars
    }
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
