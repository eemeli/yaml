import { Collection } from '../ast/Collection.js'
import { Scalar } from '../ast/Scalar.js'
import { Type, defaultTags } from '../constants.js'
import { YAMLReferenceError, YAMLWarning } from '../errors.js'
import { resolveScalar } from './resolveScalar.js'
import { resolveString } from './resolveString.js'

function resolveByTagName(doc, node, tagName) {
  const { knownTags, tags } = doc.schema
  const matchWithTest = []
  for (const tag of tags) {
    if (tag.tag === tagName) {
      if (tag.test) matchWithTest.push(tag)
      else {
        const res = tag.resolve(doc, node)
        return res instanceof Collection ? res : new Scalar(res)
      }
    }
  }

  const str = resolveString(node.strValue, error => doc.errors.push(error))
  if (typeof str === 'string' && matchWithTest.length > 0)
    return resolveScalar(str, matchWithTest, tags.scalarFallback)

  const kt = knownTags[tagName]
  if (kt) {
    tags.push(Object.assign({}, kt, { default: false, test: undefined }))
    const res = kt.resolve(doc, node)
    return res instanceof Collection ? res : new Scalar(res)
  }

  return null
}

function getFallbackTagName({ type }) {
  switch (type) {
    case Type.FLOW_MAP:
    case Type.MAP:
      return defaultTags.MAP
    case Type.FLOW_SEQ:
    case Type.SEQ:
      return defaultTags.SEQ
    default:
      return defaultTags.STR
  }
}

export function resolveTag(doc, node, tagName) {
  try {
    const res = resolveByTagName(doc, node, tagName)
    if (res) {
      if (tagName && node.tag) res.tag = tagName
      return res
    }
  } catch (error) {
    /* istanbul ignore if */
    if (!error.source) error.source = node
    doc.errors.push(error)
    return null
  }

  try {
    const fallback = getFallbackTagName(node)
    if (!fallback) throw new Error(`The tag ${tagName} is unavailable`)
    const msg = `The tag ${tagName} is unavailable, falling back to ${fallback}`
    doc.warnings.push(new YAMLWarning(node, msg))
    const res = resolveByTagName(doc, node, fallback)
    res.tag = tagName
    return res
  } catch (error) {
    const refError = new YAMLReferenceError(node, error.message)
    refError.stack = error.stack
    doc.errors.push(refError)
    return null
  }
}
