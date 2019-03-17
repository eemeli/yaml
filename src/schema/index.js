import { Type } from '../cst/Node'
import { YAMLReferenceError, YAMLWarning } from '../errors'
import stringify from '../stringify'
import core from '../tags/core'
import failsafe from '../tags/failsafe'
import map from '../tags/failsafe/map'
import seq from '../tags/failsafe/seq'
import json from '../tags/json'
import { resolveString } from '../tags/failsafe/string'
import yaml11 from '../tags/yaml-1.1'
import Alias from './Alias'
import Collection from './Collection'
import Node from './Node'
import Pair from './Pair'
import Scalar from './Scalar'

const isMap = ({ type }) => type === Type.FLOW_MAP || type === Type.MAP

const isSeq = ({ type }) => type === Type.FLOW_SEQ || type === Type.SEQ

export default class Schema {
  static defaultPrefix = 'tag:yaml.org,2002:'

  static defaultTags = {
    MAP: 'tag:yaml.org,2002:map',
    SEQ: 'tag:yaml.org,2002:seq',
    STR: 'tag:yaml.org,2002:str'
  }

  static tags = {
    core,
    failsafe,
    json,
    'yaml-1.1': yaml11
  }

  constructor({ merge, schema, tags }) {
    this.merge = !!merge
    this.name = schema
    this.tags = Schema.tags[schema]
    if (!this.tags) {
      const keys = Object.keys(Schema.tags).map(key => JSON.stringify(key))
      throw new Error(`Unknown schema; use one of ${keys.join(', ')}`)
    }
    if (Array.isArray(tags)) {
      for (const tag of tags) this.tags = this.tags.concat(tag)
    } else if (typeof tags === 'function') {
      this.tags = tags(this.tags.slice())
    }
  }

  createNode(value, wrapScalars, tag, ctx) {
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
        tagObj = value instanceof Map ? map : value[Symbol.iterator] ? seq : map
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
      const prev = ctx.prevObjects.find(o => o.value === value)
      if (prev) {
        const alias = new Alias(prev) // leaves source dirty; must be cleaned by caller
        ctx.aliasNodes.push(alias)
        return alias
      }
      obj.value = value
      ctx.prevObjects.push(obj)
    }
    obj.node = tagObj.createNode
      ? tagObj.createNode(this, value, ctx)
      : wrapScalars
      ? new Scalar(value)
      : value
    return obj.node
  }

  createPair(key, value, ctx) {
    const k = this.createNode(key, ctx.wrapScalars, null, ctx)
    const v = this.createNode(value, ctx.wrapScalars, null, ctx)
    return new Pair(k, v)
  }

  // falls back to string on no match
  resolveScalar(str, tags) {
    if (!tags) tags = this.tags
    for (let i = 0; i < tags.length; ++i) {
      const { format, test, resolve } = tags[i]
      if (test) {
        const match = str.match(test)
        if (match) {
          const res = new Scalar(resolve.apply(null, match))
          if (format) res.format = format
          return res
        }
      }
    }
    if (this.tags.scalarFallback) str = this.tags.scalarFallback(str)
    return new Scalar(str)
  }

  // sets node.resolved on success
  resolveNode(doc, node, tagName) {
    const tags = this.tags.filter(({ tag }) => tag === tagName)
    const generic = tags.find(({ test }) => !test)
    if (node.error) doc.errors.push(node.error)
    try {
      if (generic) {
        let res = generic.resolve(doc, node)
        if (!(res instanceof Collection)) res = new Scalar(res)
        node.resolved = res
      } else {
        const str = resolveString(doc, node)
        if (typeof str === 'string' && tags.length > 0) {
          node.resolved = this.resolveScalar(str, tags)
        }
      }
    } catch (error) {
      if (!error.source) error.source = node
      doc.errors.push(error)
      node.resolved = null
    }
    if (!node.resolved) return null
    if (tagName && node.tag) node.resolved.tag = tagName
    return node.resolved
  }

  resolveNodeWithFallback(doc, node, tagName) {
    const res = this.resolveNode(doc, node, tagName)
    if (node.hasOwnProperty('resolved')) return res
    const fallback = isMap(node)
      ? Schema.defaultTags.MAP
      : isSeq(node)
      ? Schema.defaultTags.SEQ
      : Schema.defaultTags.STR
    if (fallback) {
      doc.warnings.push(
        new YAMLWarning(
          node,
          `The tag ${tagName} is unavailable, falling back to ${fallback}`
        )
      )
      const res = this.resolveNode(doc, node, fallback)
      res.tag = tagName
      return res
    } else {
      doc.errors.push(
        new YAMLReferenceError(node, `The tag ${tagName} is unavailable`)
      )
    }
    return null
  }

  getTagObject(item) {
    if (item instanceof Alias) return Alias
    if (item.tag) {
      const match = this.tags.filter(t => t.tag === item.tag)
      if (match.length > 0)
        return match.find(t => t.format === item.format) || match[0]
    }
    let tagObj, obj
    if (item instanceof Scalar) {
      obj = item.value
      // TODO: deprecate/remove class check
      const match = this.tags.filter(
        t =>
          (t.identify && t.identify(obj)) || (t.class && obj instanceof t.class)
      )
      tagObj =
        match.find(t => t.format === item.format) || match.find(t => !t.format)
    } else {
      obj = item
      tagObj = this.tags.find(t => t.nodeClass && obj instanceof t.nodeClass)
    }
    if (!tagObj) {
      const name = obj && obj.constructor ? obj.constructor.name : typeof obj
      throw new Error(`Tag not resolved for ${name} value`)
    }
    return tagObj
  }

  // needs to be called before stringifier to allow for circular anchor refs
  stringifyProps(node, tagObj, { anchors, doc }) {
    const props = []
    const anchor = doc.anchors.getName(node)
    if (anchor) {
      anchors[anchor] = node
      props.push(`&${anchor}`)
    }
    if (node.tag) {
      props.push(doc.stringifyTag(node.tag))
    } else if (!tagObj.default) {
      props.push(doc.stringifyTag(tagObj.tag))
    }
    return props.join(' ')
  }

  stringify(item, ctx, onComment, onChompKeep) {
    let tagObj
    if (!(item instanceof Node)) {
      const createCtx = {
        aliasNodes: [],
        onTagObj: o => (tagObj = o),
        prevObjects: []
      }
      item = this.createNode(item, true, null, createCtx)
      const { anchors } = ctx.doc
      for (const alias of createCtx.aliasNodes) {
        alias.source = alias.source.node
        let name = anchors.getName(alias.source)
        if (!name) {
          name = anchors.newName()
          anchors.map[name] = alias.source
        }
      }
    }
    ctx.tags = this
    if (item instanceof Pair) return item.toString(ctx, onComment, onChompKeep)
    if (!tagObj) tagObj = this.getTagObject(item)
    const props = this.stringifyProps(item, tagObj, ctx)
    const str = (tagObj.stringify || stringify)(
      item,
      ctx,
      onComment,
      onChompKeep
    )
    return props
      ? item instanceof Collection && str[0] !== '{' && str[0] !== '['
        ? `${props}\n${ctx.indent}${str}`
        : `${props} ${str}`
      : str
  }
}
