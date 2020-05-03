import { Collection } from '../schema/Collection'
import { Scalar } from '../schema/Scalar'
import { resolveString } from '../tags/failsafe/string'
import { resolveScalar } from './resolveScalar'

// sets node.resolved on success
export function resolveTag(doc, node, tagName) {
  const { tags } = doc.schema
  const match = tags.filter(({ tag }) => tag === tagName)
  const generic = match.find(({ test }) => !test)
  if (node.error) doc.errors.push(node.error)
  try {
    if (generic) {
      let res = generic.resolve(doc, node)
      if (!(res instanceof Collection)) res = new Scalar(res)
      node.resolved = res
    } else {
      const str = resolveString(doc, node)
      if (typeof str === 'string' && match.length > 0) {
        node.resolved = resolveScalar(str, match, tags.scalarFallback)
      }
    }
  } catch (error) {
    /* istanbul ignore if */
    if (!error.source) error.source = node
    doc.errors.push(error)
    node.resolved = null
  }
  if (!node.resolved) return null
  if (tagName && node.tag) node.resolved.tag = tagName
  return node.resolved
}
