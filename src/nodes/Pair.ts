import type { CollectionItem } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyPair } from '../stringify/stringifyPair.ts'
import { addPairToJSMap } from './addPairToJSMap.ts'
import type { NodeOf, Primitive } from './Collection.ts'
import { NODE_TYPE, PAIR } from './identity.ts'
import type { NodeBase } from './Node.ts'
import type { ToJSContext } from './toJS.ts'

export class Pair<
  K extends Primitive | NodeBase = Primitive | NodeBase,
  V extends Primitive | NodeBase = Primitive | NodeBase
> {
  /** @internal */
  declare readonly [NODE_TYPE]: symbol

  key: NodeOf<K>
  value: NodeOf<V> | null

  /** The CST token that was composed into this pair.  */
  declare srcToken?: CollectionItem

  constructor(key: NodeOf<K>, value: NodeOf<V> | null = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR })
    this.key = key
    this.value = value
  }

  clone(schema?: Schema): Pair<K, V> {
    const key = this.key.clone(schema) as NodeOf<K>
    const value = (this.value?.clone(schema) ?? null) as NodeOf<V>
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
