import { createNode, CreateNodeContext } from '../doc/createNode.js'
import { warn } from '../log.js'
import {
  createStringifyContext,
  StringifyContext
} from '../stringify/stringify.js'
import { stringifyPair } from '../stringify/stringifyPair.js'

import { Scalar } from './Scalar.js'
import { toJS, ToJSContext } from './toJS.js'
import {
  isAlias,
  isMap,
  isNode,
  isScalar,
  isSeq,
  NodeBase,
  PAIR
} from './Node.js'

export function createPair(
  key: unknown,
  value: unknown,
  ctx: CreateNodeContext
) {
  const k = createNode(key, undefined, ctx)
  const v = createNode(value, undefined, ctx)
  return new Pair(k, v)
}

const isMergeKey = (key: unknown) =>
  key === Pair.MERGE_KEY ||
  (isScalar(key) &&
    key.value === Pair.MERGE_KEY &&
    (!key.type || key.type === Scalar.PLAIN))

// If the value associated with a merge key is a single mapping node, each of
// its key/value pairs is inserted into the current mapping, unless the key
// already exists in it. If the value associated with the merge key is a
// sequence, then this sequence is expected to contain mapping nodes and each
// of these nodes is merged in turn according to its order in the sequence.
// Keys in mapping nodes earlier in the sequence override keys specified in
// later mapping nodes. -- http://yaml.org/type/merge.html
function mergeToJSMap(
  ctx: ToJSContext | undefined,
  map:
    | Map<unknown, unknown>
    | Set<unknown>
    | Record<string | number | symbol, unknown>,
  value: unknown
) {
  if (!isAlias(value) || !isMap(value.source))
    throw new Error('Merge sources must be map aliases')
  const srcMap = value.source.toJSON(null, ctx, Map)
  for (const [key, value] of srcMap) {
    if (map instanceof Map) {
      if (!map.has(key)) map.set(key, value)
    } else if (map instanceof Set) {
      map.add(key)
    } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
      Object.defineProperty(map, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      })
    }
  }
  return map
}

export class Pair<K = unknown, V = unknown> extends NodeBase {
  static readonly MERGE_KEY = '<<'

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

  addToJSMap(
    ctx: ToJSContext | undefined,
    map:
      | Map<unknown, unknown>
      | Set<unknown>
      | Record<string | number | symbol, unknown>
  ) {
    if (ctx && ctx.doc.schema.merge && isMergeKey(this.key)) {
      if (isSeq(this.value))
        for (const it of this.value.items) mergeToJSMap(ctx, map, it)
      else if (Array.isArray(this.value))
        for (const it of this.value) mergeToJSMap(ctx, map, it)
      else mergeToJSMap(ctx, map, this.value)
    } else {
      const key = toJS(this.key, '', ctx)
      if (map instanceof Map) {
        const value = toJS(this.value, key, ctx)
        map.set(key, value)
      } else if (map instanceof Set) {
        map.add(key)
      } else {
        const stringKey = stringifyKey(this.key, key, ctx)
        const value = toJS(this.value, stringKey, ctx)
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value,
            writable: true,
            enumerable: true,
            configurable: true
          })
        else map[stringKey] = value
      }
    }
    return map
  }

  toJSON(_?: unknown, ctx?: ToJSContext) {
    const pair = ctx && ctx.mapAsMap ? new Map() : {}
    return this.addToJSMap(ctx, pair)
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

function stringifyKey(
  key: unknown,
  jsKey: unknown,
  ctx: ToJSContext | undefined
) {
  if (jsKey === null) return ''
  if (typeof jsKey !== 'object') return String(jsKey)
  if (isNode(key) && ctx && ctx.doc) {
    const strCtx = createStringifyContext(ctx.doc, {})
    strCtx.inFlow = true
    strCtx.inStringifyKey = true
    const strKey = key.toString(strCtx)
    if (!ctx.mapKeyWarned) {
      let jsonStr = JSON.stringify(strKey)
      if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + '..."'
      warn(
        ctx.doc.options.logLevel,
        `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`
      )
      ctx.mapKeyWarned = true
    }
    return strKey
  }
  return JSON.stringify(jsKey)
}
