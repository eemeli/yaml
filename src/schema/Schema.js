import { warnOptionDeprecation } from '../warnings'
import { defaultTagPrefix, defaultTags } from '../constants'
import { schemas, tags } from '../tags'
import { Alias } from './Alias'
import { Node } from './Node'
import { Pair } from './Pair'
import { Scalar } from './Scalar'

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

  createNode(value, wrapScalars, tag, ctx) {
    if (value instanceof Node) return value
    let tagObj
    if (tag) {
      if (tag.startsWith('!!')) tag = Schema.defaultPrefix + tag.slice(2)
      const match = this.tags.filter(t => t.tag === tag)
      tagObj = match.find(t => !t.format) || match[0]
      if (!tagObj) throw new Error(`Tag ${tag} not found`)
    } else {
      // TODO: deprecate/remove class check
      tagObj = this.tags.find(
        t =>
          ((t.identify && t.identify(value)) ||
            (t.class && value instanceof t.class)) &&
          !t.format
      )
      if (!tagObj) {
        if (typeof value.toJSON === 'function') value = value.toJSON()
        if (typeof value !== 'object')
          return wrapScalars ? new Scalar(value) : value
        tagObj =
          value instanceof Map
            ? tags.map
            : value[Symbol.iterator]
            ? tags.seq
            : tags.map
      }
    }
    if (!ctx) ctx = { wrapScalars }
    else ctx.wrapScalars = wrapScalars
    if (ctx.onTagObj) {
      ctx.onTagObj(tagObj)
      delete ctx.onTagObj
    }
    const obj = {}
    if (value && typeof value === 'object' && ctx.prevObjects) {
      const prev = ctx.prevObjects.get(value)
      if (prev) {
        const alias = new Alias(prev) // leaves source dirty; must be cleaned by caller
        ctx.aliasNodes.push(alias)
        return alias
      }
      obj.value = value
      ctx.prevObjects.set(value, obj)
    }
    obj.node = tagObj.createNode
      ? tagObj.createNode(this, value, ctx)
      : wrapScalars
      ? new Scalar(value)
      : value
    if (tag && obj.node instanceof Node) obj.node.tag = tag
    return obj.node
  }

  createPair(key, value, ctx) {
    if (!ctx) ctx = { wrapScalars: true }
    const k = this.createNode(key, ctx.wrapScalars, null, ctx)
    const v = this.createNode(value, ctx.wrapScalars, null, ctx)
    return new Pair(k, v)
  }
}
