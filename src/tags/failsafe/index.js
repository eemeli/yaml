import YAMLMap from '../../schema/Map'
import Pair from '../../schema/Pair'
import YAMLSeq from '../../schema/Seq'
import parseMap from '../../schema/parseMap'
import parseSeq from '../../schema/parseSeq'
import { str } from './string'

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

function createSeq(schema, obj, ctx) {
  const seq = new YAMLSeq()
  if (obj && obj[Symbol.iterator]) {
    for (const it of obj) {
      const v = schema.createNode(it, ctx.wrapScalars, null, ctx)
      seq.items.push(v)
    }
  }
  return seq
}

export const map = {
  createNode: createMap,
  default: true,
  nodeClass: YAMLMap,
  tag: 'tag:yaml.org,2002:map',
  resolve: parseMap,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}

export const seq = {
  createNode: createSeq,
  default: true,
  nodeClass: YAMLSeq,
  tag: 'tag:yaml.org,2002:seq',
  resolve: parseSeq,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}

export default [map, seq, str]
