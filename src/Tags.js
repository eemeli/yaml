import { Type } from 'raw-yaml'
import { YAMLReferenceError, YAMLSyntaxError, YAMLWarning } from './errors'
import coreTags from './type/core'
import extendedTags from './type/extended'

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
  constructor ({ extended = false, tags }) {
    this.list = extended ? extendedTags : coreTags
    if (Array.isArray(tags)) {
      this.list = this.list.concat(tags)
    } else if (typeof tags === 'function') {
      this.list = tags(this.list.slice())
    }
  }

  // falls back to string on no match
  resolveScalar (str, tags) {
    if (!tags) tags = this.list
    for (let i = 0; i < tags.length; ++i) {
      const { test, resolve } = tags[i]
      if (test) {
        const match = str.match(test)
        if (match) return resolve.apply(null, match)
      }
    }
    return str
  }

  // sets node.resolved on success
  resolveNode (doc, node, tagName) {
    const tags = this.list.filter(({ tag }) => tag === tagName)
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
    const fallback = isMap(node) ? DefaultTags.MAP : isSeq(node) ? DefaultTags.SEQ : null
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
