import { isMap, isPair, isScalar } from '../../nodes/identity.js'
import { Pair } from '../../nodes/Pair.js'
import { Scalar } from '../../nodes/Scalar.js'
import { ToJSContext } from '../../nodes/toJS.js'
import { findPair, YAMLMap } from '../../nodes/YAMLMap.js'
import type { Schema } from '../../schema/Schema.js'
import type { StringifyContext } from '../../stringify/stringify.js'
import { CreateNodeContext, createPair } from '../../util.js'
import type { CollectionTag } from '../types.js'

export class YAMLSet<T = unknown> extends YAMLMap<T, Scalar<null> | null> {
  static tag = 'tag:yaml.org,2002:set'

  constructor(schema?: Schema) {
    super(schema)
    this.tag = YAMLSet.tag
  }

  add(
    key:
      | T
      | Pair<T, Scalar<null> | null>
      | { key: T; value: Scalar<null> | null }
  ) {
    let pair: Pair<T, Scalar<null> | null>
    if (isPair(key)) pair = key
    else if (
      key &&
      typeof key === 'object' &&
      'key' in key &&
      'value' in key &&
      key.value === null
    )
      pair = new Pair(key.key, null)
    else pair = new Pair(key as T, null)
    const prev = findPair(this.items, pair.key)
    if (!prev) this.items.push(pair)
  }

  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(key: unknown, keepPair?: boolean): any {
    const pair = findPair(this.items, key)
    return !keepPair && isPair(pair)
      ? isScalar(pair.key)
        ? pair.key.value
        : pair.key
      : pair
  }

  set(key: T, value: boolean): void

  /** @deprecated Will throw; `value` must be boolean */
  set(key: T, value: null): void
  set(key: T, value: boolean | null) {
    if (typeof value !== 'boolean')
      throw new Error(
        `Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`
      )
    const prev = findPair(this.items, key)
    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1)
    } else if (!prev && value) {
      this.items.push(new Pair(key))
    }
  }

  toJSON(_?: unknown, ctx?: ToJSContext): any {
    return super.toJSON(_, ctx, Set)
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ) {
    if (!ctx) return JSON.stringify(this)
    if (this.hasAllNullValues(true))
      return super.toString(
        Object.assign({}, ctx, { allNullValues: true }),
        onComment,
        onChompKeep
      )
    else throw new Error('Set items must all have null values')
  }

  static from(schema: Schema, iterable: unknown, ctx: CreateNodeContext) {
    const { replacer } = ctx
    const set = new this(schema)
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable as Iterable<unknown>) {
        if (typeof replacer === 'function')
          value = replacer.call(iterable, value, value)
        set.items.push(
          createPair(value, null, ctx) as Pair<unknown, Scalar<null>>
        )
      }
    return set
  }
}

export const set: CollectionTag = {
  collection: 'map',
  identify: value => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: 'tag:yaml.org,2002:set',
  createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
  resolve(map, onError) {
    if (isMap(map)) {
      if (map.hasAllNullValues(true)) return Object.assign(new YAMLSet(), map)
      else onError('Set items must all have null values')
    } else onError('Expected a mapping for this tag')
    return map
  }
}
