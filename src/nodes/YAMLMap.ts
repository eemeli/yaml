import type { BlockMap, FlowCollection } from '../parse/cst.js'
import type { Schema } from '../schema/Schema.js'
import type { StringifyContext } from '../stringify/stringify.js'
import { stringifyCollection } from '../stringify/stringifyCollection.js'
import { CreateNodeContext } from '../util.js'
import { addPairToJSMap } from './addPairToJSMap.js'
import { Collection } from './Collection.js'
import { isPair, isScalar, MAP } from './identity.js'
import type { ParsedNode, Range } from './Node.js'
import { createPair, Pair } from './Pair.js'
import { isScalarValue, Scalar } from './Scalar.js'
import type { ToJSContext } from './toJS.js'

export type MapLike =
  | Map<unknown, unknown>
  | Set<unknown>
  | Record<string | number | symbol, unknown>

export function findPair<K = unknown, V = unknown>(
  items: Iterable<Pair<K, V>>,
  key: unknown
) {
  const k = isScalar(key) ? key.value : key
  for (const it of items) {
    if (isPair(it)) {
      if (it.key === key || it.key === k) return it
      if (isScalar(it.key) && it.key.value === k) return it
    }
  }
  return undefined
}

export declare namespace YAMLMap {
  interface Parsed<
    K extends ParsedNode = ParsedNode,
    V extends ParsedNode | null = ParsedNode | null
  > extends YAMLMap<K, V> {
    items: Pair<K, V>[]
    range: Range
    srcToken?: BlockMap | FlowCollection
  }
}

export class YAMLMap<K = unknown, V = unknown> extends Collection {
  static get tagName(): 'tag:yaml.org,2002:map' {
    return 'tag:yaml.org,2002:map'
  }

  items: Pair<K, V>[] = []

  constructor(schema?: Schema) {
    super(MAP, schema)
  }

  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(schema: Schema, obj: unknown, ctx: CreateNodeContext) {
    const { keepUndefined, replacer } = ctx
    const map = new this(schema)
    const add = (key: unknown, value: unknown) => {
      if (typeof replacer === 'function') value = replacer.call(obj, key, value)
      else if (Array.isArray(replacer) && !replacer.includes(key)) return
      if (value !== undefined || keepUndefined)
        map.items.push(createPair(key, value, ctx))
    }
    if (obj instanceof Map) {
      for (const [key, value] of obj) add(key, value)
    } else if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) add(key, (obj as any)[key])
    }
    if (typeof schema.sortMapEntries === 'function') {
      map.items.sort(schema.sortMapEntries)
    }
    return map
  }

  /**
   * Adds a value to the collection.
   *
   * @param overwrite - If not set `true`, using a key that is already in the
   *   collection will throw. Otherwise, overwrites the previous value.
   */
  add(pair: Pair<K, V> | { key: K; value: V }, overwrite?: boolean): void {
    let _pair: Pair<K, V>
    if (isPair(pair)) _pair = pair
    else if (!pair || typeof pair !== 'object' || !('key' in pair)) {
      // In TypeScript, this never happens.
      _pair = new Pair<K, V>(pair as any, (pair as any)?.value)
    } else _pair = new Pair(pair.key, pair.value)

    const prev = findPair(this.items, _pair.key)
    const sortEntries = this.schema?.sortMapEntries
    if (prev) {
      if (!overwrite) throw new Error(`Key ${_pair.key} already set`)
      // For scalars, keep the old node & its comments and anchors
      if (isScalar(prev.value) && isScalarValue(_pair.value))
        prev.value.value = _pair.value
      else prev.value = _pair.value
    } else if (sortEntries) {
      const i = this.items.findIndex(item => sortEntries(_pair, item) < 0)
      if (i === -1) this.items.push(_pair)
      else this.items.splice(i, 0, _pair)
    } else {
      this.items.push(_pair)
    }
  }

  delete(key: unknown): boolean {
    const it = findPair(this.items, key)
    if (!it) return false
    const del = this.items.splice(this.items.indexOf(it), 1)
    return del.length > 0
  }

  get(key: unknown, keepScalar: true): Scalar<V> | undefined
  get(key: unknown, keepScalar?: false): V | undefined
  get(key: unknown, keepScalar?: boolean): V | Scalar<V> | undefined
  get(key: unknown, keepScalar?: boolean): V | Scalar<V> | undefined {
    const it = findPair(this.items, key)
    const node = it?.value
    return (!keepScalar && isScalar<V>(node) ? node.value : node) ?? undefined
  }

  has(key: unknown): boolean {
    return !!findPair(this.items, key)
  }

  set(key: K, value: V): void {
    this.add(new Pair(key, value), true)
  }

  /**
   * @param ctx - Conversion context, originally set in Document#toJS()
   * @param {Class} Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJSON<T extends MapLike = Map<unknown, unknown>>(
    _?: unknown,
    ctx?: ToJSContext,
    Type?: { new (): T }
  ): any {
    const map = Type ? new Type() : ctx?.mapAsMap ? new Map() : {}
    if (ctx?.onCreate) ctx.onCreate(map)
    for (const item of this.items) addPairToJSMap(ctx, map, item)
    return map
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    for (const item of this.items) {
      if (!isPair(item))
        throw new Error(
          `Map items must all be pairs; found ${JSON.stringify(item)} instead`
        )
    }
    if (!ctx.allNullValues && this.hasAllNullValues(false))
      ctx = Object.assign({}, ctx, { allNullValues: true })
    return stringifyCollection(this, ctx, {
      blockItemPrefix: '',
      flowChars: { start: '{', end: '}' },
      itemIndent: ctx.indent || '',
      onChompKeep,
      onComment
    })
  }
}
