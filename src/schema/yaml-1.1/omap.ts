import { isPair, isScalar } from '../../nodes/identity.js'
import { toJS, ToJSContext } from '../../nodes/toJS.js'
import { YAMLMap } from '../../nodes/YAMLMap.js'
import { YAMLSeq } from '../../nodes/YAMLSeq.js'
import { CreateNodeContext } from '../../util.js'
import type { Schema } from '../Schema.js'
import { CollectionTag } from '../types.js'
import { createPairs, resolvePairs } from './pairs.js'

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

  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(_?: unknown, ctx?: ToJSContext) {
    if (!ctx) return super.toJSON(_)
    const map = new Map()
    if (ctx?.onCreate) ctx.onCreate(map)
    for (const pair of this.items) {
      let key, value
      if (isPair(pair)) {
        key = toJS(pair.key, '', ctx)
        value = toJS(pair.value, key, ctx)
      } else {
        key = toJS(pair, '', ctx)
      }
      if (map.has(key))
        throw new Error('Ordered maps must not include duplicate keys')
      map.set(key, value)
    }
    return map as unknown as unknown[]
  }

  static from(schema: Schema, iterable: unknown, ctx: CreateNodeContext) {
    const pairs = createPairs(schema, iterable, ctx)
    const omap = new this()
    omap.items = pairs.items
    return omap
  }
}

export const omap: CollectionTag = {
  collection: 'seq',
  identify: value => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: 'tag:yaml.org,2002:omap',

  resolve(seq, onError) {
    const pairs = resolvePairs(seq, onError)
    const seenKeys: unknown[] = []
    for (const { key } of pairs.items) {
      if (isScalar(key)) {
        if (seenKeys.includes(key.value)) {
          onError(`Ordered maps must not include duplicate keys: ${key.value}`)
        } else {
          seenKeys.push(key.value)
        }
      }
    }
    return Object.assign(new YAMLOMap(), pairs)
  },
  createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
}
