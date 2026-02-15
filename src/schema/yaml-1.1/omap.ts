import type { Document, DocValue } from '../../doc/Document.ts'
import type { Primitive } from '../../nodes/Collection.ts'
import type { Node } from '../../nodes/Node.ts'
import type { Pair } from '../../nodes/Pair.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import type { ToJSContext } from '../../nodes/toJS.ts'
import { YAMLMap } from '../../nodes/YAMLMap.ts'
import { YAMLSeq } from '../../nodes/YAMLSeq.ts'
import type { NodeCreator } from '../../util.ts'
import type { Schema } from '../Schema.ts'
import type { CollectionTag } from '../types.ts'
import { createPairs, resolvePairs } from './pairs.ts'

export class YAMLOMap<
  K extends Primitive | Node = Primitive | Node,
  V extends Primitive | Node = Primitive | Node
> extends YAMLSeq<Pair<K, V>> {
  static tag = 'tag:yaml.org,2002:omap'

  constructor(schema?: Schema, elements?: Array<Pair<K, V>>) {
    super(schema, elements)
    this.tag = YAMLOMap.tag
  }

  delete: typeof YAMLMap.prototype.delete = YAMLMap.prototype.delete.bind(this)
  get: typeof YAMLMap.prototype.get = YAMLMap.prototype.get.bind(this)
  has: typeof YAMLMap.prototype.has = YAMLMap.prototype.has.bind(this)
  push: typeof YAMLMap.prototype.push = YAMLMap.prototype.push.bind(this)
  set: typeof YAMLMap.prototype.set = YAMLMap.prototype.set.bind(this)

  /**
   * If `ctx` is given, the return type is always `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): unknown[] {
    if (!ctx) return super.toJS(doc)
    const map = new Map()
    if (this.anchor) {
      ctx.anchors.set(this, { aliasCount: 0, count: 1, res: map })
    }
    for (const pair of this) {
      const key = pair.key.toJS(doc, ctx)
      const value = pair.value ? pair.value.toJS(doc, ctx) : pair.value
      if (map.has(key))
        throw new Error('Ordered maps must not include duplicate keys')
      map.set(key, value)
    }
    return map as unknown as unknown[]
  }
}

export const omap: CollectionTag = {
  collection: 'seq',
  identify: value => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: 'tag:yaml.org,2002:omap',

  createNode(nc: NodeCreator, iterable: unknown): YAMLOMap {
    const pairs = createPairs(nc, iterable)
    return new YAMLOMap(nc.schema, pairs)
  },

  resolve(seq, onError) {
    const pairs = resolvePairs(seq, onError)
    const seenKeys: unknown[] = []
    for (const { key } of pairs) {
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
