import { YAMLSemanticError } from '../errors'
import toJSON from '../toJSON'
import Pair from './Pair'
import Scalar from './Scalar'
import YAMLSeq from './Seq'
import { createPairs, parsePairs } from './_pairs'

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

function parseOMap(doc, cst) {
  const pairs = parsePairs(doc, cst)
  return Object.assign(new YAMLOMap(), pairs)
}

function createOMap(schema, iterable, wrapScalars) {
  const omap = new YAMLOMap()
  const pairs = createPairs(schema, iterable, wrapScalars)
  omap.items = pairs.items
  return omap
}

export default {
  class: Map,
  default: false,
  tag: 'tag:yaml.org,2002:omap',
  resolve: parseOMap,
  createNode: createOMap,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}
