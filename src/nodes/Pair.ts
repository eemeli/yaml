import type { Document, DocValue } from '../doc/Document.ts'
import type { CollectionItem } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyPair } from '../stringify/stringifyPair.ts'
import { addPairToJSMap } from './addPairToJSMap.ts'
import type { NodeOf, Primitive } from './Collection.ts'
import type { NodeBase } from './Node.ts'
import type { ToJSContext } from './toJS.ts'

export class Pair<
  K extends Primitive | NodeBase = Primitive | NodeBase,
  V extends Primitive | NodeBase = Primitive | NodeBase
> {
  key: NodeOf<K>
  value: NodeOf<V> | null

  /** The CST token that was composed into this pair.  */
  declare srcToken?: CollectionItem

  constructor(key: NodeOf<K>, value: NodeOf<V> | null = null) {
    this.key = key
    this.value = value
  }

  clone(schema?: Schema): Pair<K, V> {
    const key = this.key.clone(schema) as NodeOf<K>
    const value = (this.value?.clone(schema) ?? null) as NodeOf<V>
    return new Pair(key, value)
  }

  toJS(
    doc: Document<DocValue, boolean>,
    ctx: ToJSContext
  ): ReturnType<typeof addPairToJSMap> {
    const pair = ctx.mapAsMap ? new Map() : {}
    return addPairToJSMap(doc, ctx, pair, this)
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
