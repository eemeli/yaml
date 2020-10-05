import { Pair } from '../../ast/Pair.js'
import { Scalar } from '../../ast/Scalar.js'
import { YAMLMap } from '../../ast/YAMLMap.js'
import { YAMLSeq } from '../../ast/YAMLSeq.js'
import { toJS } from '../../ast/toJS.js'
import { createPairs, parsePairs } from './pairs.js'

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
        key = toJS(pair.key, '', ctx)
        value = toJS(pair.value, key, ctx)
      } else {
        key = toJS(pair, '', ctx)
      }
      if (map.has(key))
        throw new Error('Ordered maps must not include duplicate keys')
      map.set(key, value)
    }
    return map
  }
}

function parseOMap(seq, onError) {
  const pairs = parsePairs(seq, onError)
  const seenKeys = []
  for (const { key } of pairs.items) {
    if (key instanceof Scalar) {
      if (seenKeys.includes(key.value)) {
        onError(`Ordered maps must not include duplicate keys: ${key.value}`)
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
