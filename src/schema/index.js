import { Type } from '../ast/Node'
import createNode from '../createNode'
import { YAMLReferenceError, YAMLWarning } from '../errors'
import Collection from './Collection'
import core from './core'
import extended from './extended'
import failsafe from './failsafe'
import json from './json'
import Pair from './Pair'
import Scalar from './Scalar'
import { resolve as resolveStr } from './_string'

export const availableSchema = {
  core,
  extended,
  failsafe,
  json
}

const defaultPrefix = 'tag:yaml.org,2002:'

export const DefaultTagPrefixes = [
  { handle: '!', prefix: '!' },
  { handle: '!!', prefix: defaultPrefix }
]

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
    this.schema = Array.isArray(schema) ? schema : availableSchema[schema]
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
      const { test, resolve } = tags[i]
      if (test) {
        const match = str.match(test)
        if (match) return new Scalar(resolve.apply(null, match))
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
    if (node.hasProps) node.resolved.anchor = node.anchor
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
      res.origTag = tagName
      return res
    } else {
      doc.errors.push(
        new YAMLReferenceError(node, `The tag ${tagName} is unavailable`)
      )
    }
    return null
  }

  stringify(item, ctx, onComment) {
    if (
      !(
        item instanceof Scalar ||
        item instanceof Collection ||
        item instanceof Pair
      )
    ) {
      item = createNode(item, true)
    }
    ctx.tags = this
    let match
    if (item instanceof Pair) {
      return item.toString(ctx, onComment)
    } else if (item.tag) {
      match = this.schema.filter(
        ({ format, tag }) =>
          tag === item.tag && (!item.format || format === item.format)
      )
      if (match.length === 0)
        throw new Error(
          `Tag not available: ${item.tag}${
            item.format ? ', format ' + item.format : ''
          }`
        )
    } else if (item.value === null) {
      match = this.schema.filter(t => t.class === null && !t.format)
      if (match.length === 0)
        throw new Error('Schema is missing a null stringifier')
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
      match = this.schema.filter(
        t => t.class && obj instanceof t.class && !t.format
      )
      if (match.length === 0)
        throw new Error(
          `Tag not resolved for ${
            obj && obj.constructor ? obj.constructor.name : typeof obj
          }`
        )
    }
    const stringify = match[0].stringify || Schema.defaultStringifier
    const str = stringify(item, ctx, onComment)
    const tag = item.origTag || item.tag
    if (tag && tag.indexOf(defaultPrefix) !== 0) {
      const p = ctx.doc.tagPrefixes.find(p => tag.indexOf(p.prefix) === 0)
      const tagProp = p
        ? p.handle + tag.substr(p.prefix.length)
        : tag[0] === '!'
          ? tag
          : `!<${tag}>`
      if (item instanceof Collection && !ctx.inFlow && item.items.length > 0) {
        return `${tagProp}\n${ctx.indent}${str}`
      } else {
        return `${tagProp} ${str}`
      }
    }
    return str
  }
}
