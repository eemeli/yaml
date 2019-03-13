import YAMLMap from '../../schema/Map'
import Pair from '../../schema/Pair'
import parseMap from '../../schema/parseMap'

function createMap(schema, obj, ctx) {
  const map = new YAMLMap()
  if (obj instanceof Map) {
    for (const [key, value] of obj) {
      const k = schema.createNode(key, ctx.wrapScalars, null, ctx)
      const v = schema.createNode(value, ctx.wrapScalars, null, ctx)
      map.items.push(new Pair(k, v))
    }
  } else if (obj && typeof obj === 'object') {
    map.items = Object.keys(obj).map(key => {
      const k = schema.createNode(key, ctx.wrapScalars, null, ctx)
      const v = schema.createNode(obj[key], ctx.wrapScalars, null, ctx)
      return new Pair(k, v)
    })
  }
  return map
}

export default {
  createNode: createMap,
  default: true,
  nodeClass: YAMLMap,
  tag: 'tag:yaml.org,2002:map',
  resolve: parseMap,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}
