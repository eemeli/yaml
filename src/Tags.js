import { Type } from 'raw-yaml'
import { YAMLReferenceError, YAMLSyntaxError, YAMLWarning } from './errors'
import availableSchema from './type'

export const DefaultTagPrefixes = {
  '!': '!',
  '!!': 'tag:yaml.org,2002:'
}

export const DefaultTags = {
  MAP: 'tag:yaml.org,2002:map',
  SEQ: 'tag:yaml.org,2002:seq',
  STR: 'tag:yaml.org,2002:str'
}

const isMap = ({ type }) => (type === Type.FLOW_MAP || type === Type.MAP)

const isSeq = ({ type }) => (type === Type.FLOW_SEQ || type === Type.SEQ)

export default class Tags {
  constructor ({ schema, tags }) {
    this.schema = Array.isArray(schema) ? schema : availableSchema[schema || '']
    if (!this.schema) {
      const keys = Object.keys(availableSchema)
        .filter(key => key)
        .map(key => JSON.stringify(key))
        .join(', ')
      throw new Error(`Unknown schema; use ${keys}, or { tag, test, resolve }[]`)
    }
    if (Array.isArray(tags)) {
      this.schema = this.schema.concat(tags)
    } else if (typeof tags === 'function') {
      this.schema = tags(this.schema.slice())
    }
  }

  // falls back to string on no match
  resolveScalar (str, tags) {
    if (!tags) tags = this.schema
    for (let i = 0; i < tags.length; ++i) {
      const { test, resolve } = tags[i]
      if (test) {
        const match = str.match(test)
        if (match) return resolve.apply(null, match)
      }
    }
    return this.schema.scalarFallback ? this.schema.scalarFallback(str) : str
  }

  // sets node.resolved on success
  resolveNode (doc, node, tagName) {
    const tags = this.schema.filter(({ tag }) => tag === tagName)
    const generic = tags.find(({ test }) => !test)
    try {
      if (generic) return node.resolved = generic.resolve(doc, node)
      const str = node.strValue
      if (typeof str === 'string' && tags.length > 0) {
        return node.resolved = this.resolveScalar(str, tags)
      }
    } catch (error) {
      if (error instanceof SyntaxError) error = new YAMLSyntaxError(node, error.message)
      else error.source = node
      doc.errors.push(error)
      node.resolved = null
    }
    return null
  }

  resolve (doc, node, tagName) {
    const res = this.resolveNode(doc, node, tagName)
    if (node.hasOwnProperty('resolved')) return res
    const fallback = (
      isMap(node) ? DefaultTags.MAP
      : isSeq(node) ? DefaultTags.SEQ
      : DefaultTags.STR
    )
    if (fallback) {
      const err =
      doc.errors.push(new YAMLWarning(node,
        `The tag ${tagName} is unavailable, falling back to ${fallback}`))
      return this.resolveNode(doc, node, fallback)
    } else {
      doc.errors.push(new YAMLReferenceError(node,
        `The tag ${tagName} is unavailable`))
    }
    return null
  }
}
