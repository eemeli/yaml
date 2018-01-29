import { Type } from 'raw-yaml'
import { YAMLSyntaxError } from '../errors'

export function resolveBlockMapPairs (doc, map) {
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

export function resolveFlowMapPairs (doc, map) {
  const pairs = []
  let key = undefined
  let explicitKey = false
  let next = '{'
  for (let i = 0; i < map.items.length; ++i) {
    const item = map.items[i]
    if (typeof item === 'string') {
      if (item === '?' && key === undefined && !explicitKey) {
        // TODO: create errors for non-extended multiline plain keys
        explicitKey = true
        next = ':'
        continue
      }
      if (item === ':') {
        if (key === undefined) key = null
        if (next === ':') {
          next = ','
          continue
        }
      } else {
        if (explicitKey) {
          if (key === undefined) key = null
          explicitKey = false
        }
        if (key !== undefined) {
          pairs.push({ key })
          key === undefined
        }
      }
      if (item === '}') {
        if (i === node.items.length - 1) continue
      } else if (item === next) {
        next = ':'
        continue
      }
      doc.errors.push(new YAMLSyntaxError(node, `Flow map contains an unexpected ${item}`))
    } else if (item.type === Type.COMMENT) {
      pairs.push({ comment: item.comment })
    } else if (key === undefined) {
      if (next === ',') doc.errors.push(new YAMLSyntaxError(item, 'Separator , missing in flow map'))
      key = doc.resolveNode(item)
    } else {
      if (next !== ',') doc.errors.push(new YAMLSyntaxError(item, 'Indicator : missing in flow map entry'))
      pairs.push({ key, value: doc.resolveNode(item) })
      key = undefined
    }
  }
  if (key !== undefined) pairs.push({ key })
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
  const pairs = node.type === Type.FLOW_MAP ? (
    resolveFlowMapPairs(doc, node)
  ) : (
    resolveBlockMapPairs(doc, node)
  )
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
