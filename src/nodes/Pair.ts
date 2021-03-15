import { createNode, CreateNodeContext } from '../doc/createNode.js'
import { StringifyContext } from '../stringify/stringify.js'
import { stringifyPair } from '../stringify/stringifyPair.js'
import { addPairToJSMap } from './addPairToJSMap.js'
import { isNode, NodeBase, PAIR } from './Node.js'
import { Scalar } from './Scalar.js'
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

export class Pair<K = unknown, V = unknown> extends NodeBase {
  /** Always Node or null when parsed, but can be set to anything. */
  key: K

  /** Always Node or null when parsed, but can be set to anything. */
  value: V | null

  constructor(key: K, value: V | null = null) {
    super(PAIR)
    this.key = key
    this.value = value
  }

  // @ts-ignore This is fine.
  get commentBefore() {
    return isNode(this.key) ? this.key.commentBefore : undefined
  }

  set commentBefore(cb) {
    if (this.key == null) this.key = new Scalar(null) as any // FIXME
    if (isNode(this.key)) this.key.commentBefore = cb
    else {
      const msg =
        'Pair.commentBefore is an alias for Pair.key.commentBefore. To set it, the key must be a Node.'
      throw new Error(msg)
    }
  }

  // @ts-ignore This is fine.
  get spaceBefore() {
    return isNode(this.key) ? this.key.spaceBefore : undefined
  }

  set spaceBefore(sb) {
    if (this.key == null) this.key = new Scalar(null) as any // FIXME
    if (isNode(this.key)) this.key.spaceBefore = sb
    else {
      const msg =
        'Pair.spaceBefore is an alias for Pair.key.spaceBefore. To set it, the key must be a Node.'
      throw new Error(msg)
    }
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
