import type { CreateNodeOptions } from '../options.ts'
import type { BlockMap, FlowCollection } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyCollection } from '../stringify/stringifyCollection.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import { addPairToJSMap } from './addPairToJSMap.ts'
import { Collection, type Primitive } from './Collection.ts'
import { isNode, isPair, isScalar, MAP } from './identity.ts'
import type { NodeBase } from './Node.ts'
import { Pair } from './Pair.ts'
import type { Scalar } from './Scalar.ts'
import type { ToJSContext } from './toJS.ts'

export type MapLike =
  | Map<unknown, unknown>
  | Set<unknown>
  | Record<string | number | symbol, unknown>

export function findPair<
  K extends Primitive | NodeBase = Primitive | NodeBase,
  V extends Primitive | NodeBase = Primitive | NodeBase
>(items: Iterable<Pair<K, V>>, key: unknown): Pair<K, V> | undefined {
  const k = isScalar(key) ? key.value : key
  for (const it of items) {
    if (it.key === key || it.key === k) return it
    if (isScalar(it.key) && it.key.value === k) return it
  }
  return undefined
}

export class YAMLMap<
  K extends Primitive | NodeBase = Primitive | NodeBase,
  V extends Primitive | NodeBase = Primitive | NodeBase
> extends Collection {
  static get tagName(): 'tag:yaml.org,2002:map' {
    return 'tag:yaml.org,2002:map'
  }

  items: Pair<K, V>[] = []
  declare srcToken?: BlockMap | FlowCollection

  constructor(schema?: Schema) {
    super(MAP, schema)
  }

  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(nc: NodeCreator, obj: unknown): YAMLMap<any, any> {
    const { replacer } = nc
    const map = new this(nc.schema)
    const add = (key: unknown, value: unknown) => {
      if (typeof replacer === 'function') value = replacer.call(obj, key, value)
      else if (Array.isArray(replacer) && !replacer.includes(key)) return
      if (value !== undefined || nc.keepUndefined)
        map.items.push(nc.createPair(key, value))
    }
    if (obj instanceof Map) {
      for (const [key, value] of obj) add(key, value)
    } else if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) add(key, (obj as any)[key])
    }
    if (typeof nc.schema.sortMapEntries === 'function') {
      map.items.sort(nc.schema.sortMapEntries)
    }
    return map
  }

  /**
   * Adds a key-value pair to the map.
   *
   * Using a key that is already in the collection overwrites the previous value.
   */
  add(pair: Pair<K, V>): void {
    if (!isPair(pair)) throw new TypeError('Expected a Pair')

    const prev = findPair(this.items, pair.key)
    const sortEntries = this.schema?.sortMapEntries
    if (prev) {
      // For scalars, keep the old node & its comments and anchors
      if (isScalar(prev.value) && isScalar(pair.value))
        prev.value.value = pair.value.value
      else prev.value = pair.value
    } else if (sortEntries) {
      const i = this.items.findIndex(item => sortEntries(pair, item) < 0)
      if (i === -1) this.items.push(pair)
      else this.items.splice(i, 0, pair)
    } else {
      this.items.push(pair)
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
    return (
      (!keepScalar && isScalar(node) ? (node.value as V) : node) ?? undefined
    )
  }

  has(key: unknown): boolean {
    return !!findPair(this.items, key)
  }

  set(
    key: unknown,
    value: unknown,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    let pair: Pair
    if (isNode(key) && (isNode(value) || value === null)) {
      pair = new Pair(key, value)
    } else if (!this.schema) {
      throw new Error('Schema is required')
    } else {
      const nc = new NodeCreator(this.schema, {
        ...options,
        aliasDuplicateObjects: false
      })
      pair = nc.createPair(key, value)
      nc.setAnchors()
    }
    this.add(pair as Pair<K, V>)
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
    return stringifyCollection(this, ctx, {
      blockItemPrefix: '',
      flowChars: { start: '{', end: '}' },
      itemIndent: ctx.indent || '',
      onChompKeep,
      onComment
    })
  }
}
