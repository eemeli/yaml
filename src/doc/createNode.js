import { Alias } from '../ast/Alias.js'
import { Node } from '../ast/Node.js'
import { Scalar } from '../ast/Scalar.js'
import { defaultTagPrefix } from '../constants.js'
import { map } from '../tags/failsafe/map.js'
import { seq } from '../tags/failsafe/seq.js'

function findTagObject(value, tagName, tags) {
  if (tagName) {
    const match = tags.filter(t => t.tag === tagName)
    const tagObj = match.find(t => !t.format) || match[0]
    if (!tagObj) throw new Error(`Tag ${tagName} not found`)
    return tagObj
  }
  return tags.find(t => t.identify && t.identify(value) && !t.format)
}

export function createNode(value, tagName, ctx) {
  if (value instanceof Node) return value
  const { aliasNodes, onTagObj, prevObjects, schema, wrapScalars } = ctx
  if (tagName && tagName.startsWith('!!'))
    tagName = defaultTagPrefix + tagName.slice(2)

  let tagObj = findTagObject(value, tagName, schema.tags)
  if (!tagObj) {
    if (typeof value.toJSON === 'function') value = value.toJSON()
    if (typeof value !== 'object')
      return wrapScalars ? new Scalar(value) : value
    tagObj = value instanceof Map ? map : value[Symbol.iterator] ? seq : map
  }
  if (onTagObj) {
    onTagObj(tagObj)
    delete ctx.onTagObj
  }

  // Detect duplicate references to the same object & use Alias nodes for all
  // after first. The `obj` wrapper allows for circular references to resolve.
  const obj = {}
  if (value && typeof value === 'object' && prevObjects) {
    const prev = prevObjects.get(value)
    if (prev) {
      if (!aliasNodes)
        throw new Error('Circular references are not supported here')
      const alias = new Alias(prev) // leaves source dirty; must be cleaned by caller
      aliasNodes.push(alias)
      return alias
    }
    obj.value = value
    prevObjects.set(value, obj)
  }

  obj.node = tagObj.createNode
    ? tagObj.createNode(ctx.schema, value, ctx)
    : wrapScalars
    ? new Scalar(value)
    : value
  if (tagName && obj.node instanceof Node) obj.node.tag = tagName

  return obj.node
}
