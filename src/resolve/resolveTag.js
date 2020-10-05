import { Collection } from '../ast/Collection.js'
import { Scalar } from '../ast/Scalar.js'
import { Type, defaultTags } from '../constants.js'
import {
  YAMLReferenceError,
  YAMLSemanticError,
  YAMLWarning
} from '../errors.js'
import { resolveMap } from './resolveMap.js'
import { resolveScalar } from './resolveScalar.js'
import { resolveSeq } from './resolveSeq.js'

function resolveByTagName({ knownTags, tags }, tagName, value, onError) {
  const matchWithTest = []
  for (const tag of tags) {
    if (tag.tag === tagName) {
      if (tag.test) {
        if (typeof value === 'string') matchWithTest.push(tag)
        else onError(`The tag ${tagName} cannot be applied to a collection`)
      } else {
        const res = tag.resolve(value, onError)
        return res instanceof Collection ? res : new Scalar(res)
      }
    }
  }
  if (matchWithTest.length > 0) return resolveScalar(value, matchWithTest)

  const kt = knownTags[tagName]
  if (kt) {
    tags.push(Object.assign({}, kt, { default: false, test: undefined }))
    const res = kt.resolve(value, onError)
    return res instanceof Collection ? res : new Scalar(res)
  }

  return null
}

export function resolveTag(doc, node, tagName) {
  const { MAP, SEQ, STR } = defaultTags
  let value, fallback
  const onError = message =>
    doc.errors.push(new YAMLSemanticError(node, message))
  try {
    switch (node.type) {
      case Type.FLOW_MAP:
      case Type.MAP:
        value = resolveMap(doc, node)
        fallback = MAP
        if (tagName === SEQ || tagName === STR)
          onError(`The tag ${tagName} cannot be applied to a mapping`)
        break
      case Type.FLOW_SEQ:
      case Type.SEQ:
        value = resolveSeq(doc, node)
        fallback = SEQ
        if (tagName === MAP || tagName === STR)
          onError(`The tag ${tagName} cannot be applied to a sequence`)
        break
      default:
        value = node.strValue || ''
        if (typeof value !== 'string') {
          value.errors.forEach(error => doc.errors.push(error))
          value = value.str
        }
        if (tagName === MAP || tagName === SEQ)
          onError(`The tag ${tagName} cannot be applied to a scalar`)
        fallback = STR
    }

    const res = resolveByTagName(doc.schema, tagName, value, onError)
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
    if (!fallback) throw new Error(`The tag ${tagName} is unavailable`)
    const msg = `The tag ${tagName} is unavailable, falling back to ${fallback}`
    doc.warnings.push(new YAMLWarning(node, msg))
    const res = resolveByTagName(doc.schema, fallback, value, onError)
    res.tag = tagName
    return res
  } catch (error) {
    const refError = new YAMLReferenceError(node, error.message)
    refError.stack = error.stack
    doc.errors.push(refError)
    return null
  }
}
