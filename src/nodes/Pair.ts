import type { CollectionItem } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyPair } from '../stringify/stringifyPair.ts'
import { addPairToJSMap } from './addPairToJSMap.ts'
import { isNode, NODE_TYPE, PAIR } from './identity.ts'
import type { ToJSContext } from './toJS.ts'

export class Pair<K = unknown, V = unknown> {
  /** @internal */
  declare readonly [NODE_TYPE]: symbol

  /** Always Node or null when parsed, but can be set to anything. */
  key: K

  /** Always Node or null when parsed, but can be set to anything. */
  value: V | null

  /** The CST token that was composed into this pair.  */
  declare srcToken?: CollectionItem

  constructor(key: K, value: V | null = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR })
    this.key = key
    this.value = value
  }

  clone(schema?: Schema): Pair<K, V> {
    let { key, value } = this
    if (isNode(key)) key = key.clone(schema) as unknown as K
    if (isNode(value)) value = value.clone(schema) as unknown as V
    return new Pair(key, value)
  }

  toJSON(_?: unknown, ctx?: ToJSContext): ReturnType<typeof addPairToJSMap> {
    const pair = ctx?.mapAsMap ? new Map() : {}
    return addPairToJSMap(ctx, pair, this)
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    return ctx?.doc
      ? stringifyPair(this, ctx, onComment, onChompKeep)
      : JSON.stringify(this)
  }
}
