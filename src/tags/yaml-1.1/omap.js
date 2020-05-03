import { YAMLSemanticError } from '../../errors'
import { Pair } from '../../ast/Pair'
import { Scalar } from '../../ast/Scalar'
import { YAMLMap } from '../../ast/YAMLMap'
import { YAMLSeq } from '../../ast/YAMLSeq'
import { toJSON } from '../../ast/toJSON'
import { createPairs, parsePairs } from './pairs'

export class YAMLOMap extends YAMLSeq {
  static tag = 'tag:yaml.org,2002:omap'

  constructor() {
    super()
    this.tag = YAMLOMap.tag
  }

  add = YAMLMap.prototype.add.bind(this)
  delete = YAMLMap.prototype.delete.bind(this)
  get = YAMLMap.prototype.get.bind(this)
  has = YAMLMap.prototype.has.bind(this)
  set = YAMLMap.prototype.set.bind(this)

  toJSON(_, ctx) {
    const map = new Map()
    if (ctx && ctx.onCreate) ctx.onCreate(map)
    for (const pair of this.items) {
      let key, value
      if (pair instanceof Pair) {
        key = toJSON(pair.key, '', ctx)
        value = toJSON(pair.value, key, ctx)
      } else {
        key = toJSON(pair, '', ctx)
      }
      if (map.has(key))
        throw new Error('Ordered maps must not include duplicate keys')
      map.set(key, value)
    }
    return map
  }
}

function parseOMap(doc, cst) {
  const pairs = parsePairs(doc, cst)
  const seenKeys = []
  for (const { key } of pairs.items) {
    if (key instanceof Scalar) {
      if (seenKeys.includes(key.value)) {
        const msg = 'Ordered maps must not include duplicate keys'
        throw new YAMLSemanticError(cst, msg)
      } else {
        seenKeys.push(key.value)
      }
    }
  }
  return Object.assign(new YAMLOMap(), pairs)
}

function createOMap(schema, iterable, ctx) {
  const pairs = createPairs(schema, iterable, ctx)
  const omap = new YAMLOMap()
  omap.items = pairs.items
  return omap
}

export const omap = {
  identify: value => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: 'tag:yaml.org,2002:omap',
  resolve: parseOMap,
  createNode: createOMap
}
