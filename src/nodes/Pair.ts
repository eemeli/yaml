import { createNode, CreateNodeContext } from '../doc/createNode.js'
import { StringifyContext } from '../stringify/stringify.js'
import { stringifyPair } from '../stringify/stringifyPair.js'
import { addPairToJSMap } from './addPairToJSMap.js'
import { NODE_TYPE, PAIR } from './Node.js'
import { ToJSContext } from './toJS.js'

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
  readonly [NODE_TYPE]: symbol

  /** Always Node or null when parsed, but can be set to anything. */
  key: K

  /** Always Node or null when parsed, but can be set to anything. */
  value: V | null

  constructor(key: K, value: V | null = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR })
    this.key = key
    this.value = value
  }

  toJSON(_?: unknown, ctx?: ToJSContext): ReturnType<typeof addPairToJSMap> {
    const pair = ctx && ctx.mapAsMap ? new Map() : {}
    return addPairToJSMap(ctx, pair, this)
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    return ctx && ctx.doc
      ? stringifyPair(this, ctx, onComment, onChompKeep)
      : JSON.stringify(this)
  }
}
