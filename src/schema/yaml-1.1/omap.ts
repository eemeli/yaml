import type { Document, DocValue } from '../../doc/Document.ts'
import { Pair } from '../../nodes/Pair.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import type { ToJSContext } from '../../nodes/toJS.ts'
import type { Node, Primitive } from '../../nodes/types.ts'
import { YAMLSeq } from '../../nodes/YAMLSeq.ts'
import type { StringifyContext } from '../../util.ts'
import type { Schema } from '../Schema.ts'
import type { CollectionTag } from '../types.ts'
import { createPairs, resolvePairs } from './pairs.ts'

export class YAMLOMap<
  K extends Primitive | Node = Primitive | Node,
  V extends Primitive | Node = Primitive | Node
> extends YAMLSeq<Pair<K, V>> {
  constructor(schema: Schema, elements?: Array<Pair<K, V>>) {
    super(schema, elements)
    this.tag = omap.tag
  }

  /**
   * Append new pairs to the omap, and return its new length.
   */
  push(...pairs: Pair<K, V>[]): number {
    for (const pair of pairs) {
      if (pair instanceof Pair) super.push(pair)
      else throw new Error('Omap only supports Pair values')
    }
    return this.length
  }

  /**
   * Set a pair in this omap.
   *
   * Throws if `idx` is not an integer.
   */
  set(idx: number, pair: Pair<K, V>): void {
    if (!Number.isInteger(idx))
      throw new TypeError(`Expected an integer, not ${JSON.stringify(idx)}.`)
    if (idx < 0) {
      if (idx < -this.length) throw new RangeError(`Invalid index ${idx}`)
      idx += this.length
    }
    this[idx] = pair
  }

  /**
   * The returned value actually has type `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): never[] {
    if (!ctx) return super.toJS(doc) as never[]
    const map = new Map()
    if (this.anchor) {
      ctx.anchors.set(this, { aliasCount: 0, count: 1, res: map })
    }
    for (const pair of this) {
      const key = pair.key.toJS(doc, ctx)
      const value = pair.value ? pair.value.toJS(doc, ctx) : null
      if (map.has(key))
        throw new Error('Ordered maps must not include duplicate keys')
      map.set(key, value)
    }
    return map as unknown as never[]
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    const keys = new Set()
    for (const pair of this) {
      const key = this.schema.mapKey(pair)
      if (keys.has(key))
        throw new Error('Ordered maps must not include duplicate keys')
      keys.add(key)
    }
    return super.toString(ctx, onComment, onChompKeep)
  }
}

export const omap: CollectionTag = {
  collection: 'seq',
  identify: value => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: 'tag:yaml.org,2002:omap',

  createNode(nc, iterable) {
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
    return Object.assign(new YAMLOMap(seq.schema), pairs)
  }
}
