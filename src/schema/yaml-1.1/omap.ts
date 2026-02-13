import type { Primitive } from '../../nodes/Collection.ts'
import type { NodeBase } from '../../nodes/Node.ts'
import { Pair } from '../../nodes/Pair.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import type { ToJSContext } from '../../nodes/toJS.ts'
import { toJS } from '../../nodes/toJS.ts'
import { YAMLMap } from '../../nodes/YAMLMap.ts'
import { YAMLSeq } from '../../nodes/YAMLSeq.ts'
import type { NodeCreator } from '../../util.ts'
import type { Schema } from '../Schema.ts'
import type { CollectionTag } from '../types.ts'
import { createPairs, resolvePairs } from './pairs.ts'

export class YAMLOMap<
  K extends Primitive | NodeBase = Primitive | NodeBase,
  V extends Primitive | NodeBase = Primitive | NodeBase
> extends YAMLSeq<Pair<K, V>> {
  static tag = 'tag:yaml.org,2002:omap'

  constructor(schema?: Schema) {
    super(schema)
    this.tag = YAMLOMap.tag
  }

  add: typeof YAMLMap.prototype.add = YAMLMap.prototype.add.bind(this)
  delete: typeof YAMLMap.prototype.delete = YAMLMap.prototype.delete.bind(this)
  get: typeof YAMLMap.prototype.get = YAMLMap.prototype.get.bind(this)
  has: typeof YAMLMap.prototype.has = YAMLMap.prototype.has.bind(this)
  set: typeof YAMLMap.prototype.set = YAMLMap.prototype.set.bind(this)

  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(_?: unknown, ctx?: ToJSContext): unknown[] {
    if (!ctx) return super.toJSON(_)
    const map = new Map()
    if (ctx?.onCreate) ctx.onCreate(map)
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
    return map as unknown as unknown[]
  }

  static from(nc: NodeCreator, iterable: unknown): YAMLOMap {
    const pairs = createPairs(nc, iterable)
    const omap = new this(nc.schema)
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
}
