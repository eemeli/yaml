import { YAMLMap } from '../../ast/YAMLMap'
import { resolveMap } from '../../resolve/resolveMap'

function createMap(schema, obj, ctx) {
  const map = new YAMLMap(schema)
  if (obj instanceof Map) {
    for (const [key, value] of obj)
      map.items.push(schema.createPair(key, value, ctx))
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj))
      map.items.push(schema.createPair(key, obj[key], ctx))
  }
  if (typeof schema.sortMapEntries === 'function') {
    map.items.sort(schema.sortMapEntries)
  }
  return map
}

export const map = {
  createNode: createMap,
  default: true,
  nodeClass: YAMLMap,
  tag: 'tag:yaml.org,2002:map',
  resolve: resolveMap
}
