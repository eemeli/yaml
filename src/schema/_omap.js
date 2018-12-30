import { YAMLSemanticError } from '../errors'
import toJSON from '../toJSON'
import YAMLMap from './Map'
import Pair from './Pair'
import parseSeq from './parseSeq'
import YAMLSeq from './Seq'

export class YAMLOMap extends YAMLSeq {
  toJSON(_, opt) {
    const map = new Map()
    for (const pair of this.items) {
      let key, value
      if (pair instanceof Pair) {
        key = toJSON(pair.key, '', opt)
        value = toJSON(pair.value, key, opt)
      } else {
        key = toJSON(pair, '', opt)
      }
      if (map.has(key))
        throw new Error('Ordered maps must not include duplicate values')
      map.set(key, value)
    }
    return map
  }
}

function parsePairs(doc, cst) {
  const seq = parseSeq(doc, cst)
  const omap = Object.assign(new YAMLOMap(), seq)
  for (let i = 0; i < omap.items.length; ++i) {
    let item = omap.items[i]
    if (item instanceof Pair) continue
    else if (item instanceof YAMLMap) {
      if (item.items.length > 1) {
        const msg = 'Each pair must have its own sequence indicator'
        throw new YAMLSemanticError(cst, msg)
      }
      const pair = item.items[0] || new Pair()
      if (item.commentBefore)
        pair.commentBefore = pair.commentBefore
          ? `${item.commentBefore}\n${pair.commentBefore}`
          : item.commentBefore
      if (item.comment)
        pair.comment = pair.comment
          ? `${item.comment}\n${pair.comment}`
          : item.comment
      item = pair
    }
    omap.items[i] = item instanceof Pair ? item : new Pair(item)
  }
  return omap
}

function createPairs(schema, iterable, wrapScalars) {
  const omap = new YAMLOMap()
  for (const it of iterable) {
    if (!Array.isArray(it) || it.length !== 2)
      throw new TypeError(`Expected [key, value] tuple: ${it}`)
    const k = schema.createNode(it[0], wrapScalars)
    const v = schema.createNode(it[1], wrapScalars)
    omap.items.push(new Pair(k, v))
  }
  return omap
}

export default {
  class: Map,
  default: false,
  tag: 'tag:yaml.org,2002:omap',
  resolve: parsePairs,
  createNode: createPairs,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}
