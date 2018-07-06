import { Type } from '../cst/Node'
import createNode from '../createNode'
import { YAMLReferenceError, YAMLWarning } from '../errors'
import Alias from './Alias'
import Collection from './Collection'
import core from './core'
import failsafe from './failsafe'
import json from './json'
import Node from './Node'
import Pair from './Pair'
import Scalar from './Scalar'
import { resolve as resolveStr } from './_string'
import yaml11 from './yaml-1.1'

export const availableSchema = {
  core,
  failsafe,
  json,
  'yaml-1.1': yaml11
}

export const defaultPrefix = 'tag:yaml.org,2002:'

export const DefaultTags = {
  MAP: 'tag:yaml.org,2002:map',
  SEQ: 'tag:yaml.org,2002:seq',
  STR: 'tag:yaml.org,2002:str'
}

const isMap = ({ type }) => type === Type.FLOW_MAP || type === Type.MAP

const isSeq = ({ type }) => type === Type.FLOW_SEQ || type === Type.SEQ

export default class Schema {
  static defaultStringifier(value) {
    return JSON.stringify(value)
  }

  constructor({ merge, schema, tags }) {
    this.merge = !!merge
    this.name = schema
    this.schema = availableSchema[schema]
    if (!this.schema) {
      const keys = Object.keys(availableSchema)
        .map(key => JSON.stringify(key))
        .join(', ')
      throw new Error(
        `Unknown schema; use ${keys}, or { tag, test, resolve }[]`
      )
    }
    if (Array.isArray(tags)) {
      this.schema = this.schema.concat(tags)
    } else if (typeof tags === 'function') {
      this.schema = tags(this.schema.slice())
    }
  }

  // falls back to string on no match
  resolveScalar(str, tags) {
    if (!tags) tags = this.schema
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
    if (this.schema.scalarFallback) str = this.schema.scalarFallback(str)
    return new Scalar(str)
  }

  // sets node.resolved on success
  resolveNode(doc, node, tagName) {
    const tags = this.schema.filter(({ tag }) => tag === tagName)
    const generic = tags.find(({ test }) => !test)
    if (node.error) doc.errors.push(node.error)
    try {
      if (generic) {
        let res = generic.resolve(doc, node)
        if (!(res instanceof Collection)) res = new Scalar(res)
        node.resolved = res
      } else {
        const str = resolveStr(doc, node)
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
    if (tagName) node.resolved.tag = tagName
    return node.resolved
  }

  resolveNodeWithFallback(doc, node, tagName) {
    const res = this.resolveNode(doc, node, tagName)
    if (node.hasOwnProperty('resolved')) return res
    const fallback = isMap(node)
      ? DefaultTags.MAP
      : isSeq(node)
        ? DefaultTags.SEQ
        : DefaultTags.STR
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

  getStringifier(item) {
    if (item instanceof Alias) return Alias.stringify
    let match
    if (item.tag) {
      match = this.schema.find(
        ({ format, tag }) => tag === item.tag && format === item.format
      )
      if (!match) match = this.schema.find(({ tag }) => tag === item.tag)
      if (match) return match.stringify || Schema.defaultStringifier
    }
    if (item.value === null) {
      match = this.schema.find(t => t.class === null && !t.format)
      if (!match) throw new Error('Schema is missing a null stringifier')
    } else {
      let obj = item
      if (item.hasOwnProperty('value')) {
        switch (typeof item.value) {
          case 'boolean':
            obj = new Boolean()
            break
          case 'number':
            obj = new Number()
            break
          case 'string':
            obj = new String()
            break
          default:
            obj = item.value
        }
      }
      match = this.schema.find(
        t => t.class && obj instanceof t.class && t.format === item.format
      )
      if (!match) {
        match = this.schema.find(
          t => t.class && obj instanceof t.class && !t.format
        )
      }
      if (!match) {
        const name = obj && obj.constructor ? obj.constructor.name : typeof obj
        throw new Error(`Tag not resolved for ${name}`)
      }
    }
    return match.stringify || Schema.defaultStringifier
  }

  // needs to be called before stringifier to allow for circular anchor refs
  stringifyProps(node, { anchors, doc }) {
    const props = []
    const anchor = doc.anchors.getName(node)
    if (anchor) {
      anchors[anchor] = node
      props.push(`&${anchor}`)
    }
    const { tag } = node
    // FIXME: should read prefix-skip from schema
    if (tag && tag.indexOf(defaultPrefix) !== 0) {
      props.push(doc.stringifyTag(tag))
    }
    return props.join(' ')
  }

  stringify(item, ctx, onComment) {
    if (!(item instanceof Node)) item = createNode(item, true)
    ctx.tags = this
    if (item instanceof Pair) return item.toString(ctx, onComment)
    const stringify = this.getStringifier(item)
    const props = this.stringifyProps(item, ctx)
    const str = stringify(item, ctx, onComment)
    return props
      ? item instanceof Collection && str[0] !== '{' && str[0] !== '['
        ? `${props}\n${ctx.indent}${str}`
        : `${props} ${str}`
      : str
  }
}
