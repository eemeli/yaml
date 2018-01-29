import { Type } from 'raw-yaml'
import { YAMLSyntaxError } from '../errors'

export function resolveMapPairs (doc, map) {
  const pairs = []
  let key = undefined
  for (let i = 0; i < map.items.length; ++i) {
    const item = map.items[i]
    switch (item.type) {
      case Type.COMMENT:
        pairs.push({ comment: item.comment })
        break
      case Type.MAP_KEY:
        if (key !== undefined) pairs.push({ key })
        key = doc.resolveNode(item.node)
        break
      case Type.MAP_VALUE:
        pairs.push({ key, value: doc.resolveNode(item.node) })
        key = undefined
        break
      default:
        if (key !== undefined) pairs.push({ key })
        key = doc.resolveNode(item)
    }
  }
  // TODO: include map & item comments
  return pairs
}

export default function resolveMap (doc, node) {
  const comments = []
  class YAMLMap {
    comments () { return comments }
    toString () { return JSON.stringify(this) }
  }
  const map = node.resolved = new YAMLMap()
  const pairs = resolveMapPairs(doc, node)
  for (let i = 0; i < pairs.length; ++i) {
    const { comment, key, value = null } = pairs[i]
    if (comment) {
      let j = i + 1
      let next = pairs[j]
      while (next && next.comment) next = pairs[j += 1]
      comments.push({ before: next && next.key, comment })
    } else {
      if (map.hasOwnProperty(key)) doc.errors.push(new YAMLSyntaxError(node,
        `Map keys should be unique; ${key} is redefined`
      ))
      map[key] = value
    }
  }
  return map
}
