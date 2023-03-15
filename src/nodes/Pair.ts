import { createNode, CreateNodeContext } from '../doc/createNode.js'
import type { CollectionItem } from '../parse/cst.js'
import type { Schema } from '../schema/Schema.js'
import type { StringifyContext } from '../stringify/stringify.js'
import { stringifyPair } from '../stringify/stringifyPair.js'
import { addPairToJSMap } from './addPairToJSMap.js'
import { isNode, NODE_TYPE, PAIR } from './identity.js'
import type { ToJSContext } from './toJS.js'

export function createPair(
  key: unknown,
  value: unknown,
  ctx: CreateNodeContext
) {
  const k = createNode(key, undefined, ctx)
  const v = createNode(value, undefined, ctx)
  return new Pair(k, v)
}

export class Pair<K = unknown, V = unknown> {
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
