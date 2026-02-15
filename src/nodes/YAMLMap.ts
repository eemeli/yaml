import type { Document, DocValue } from '../doc/Document.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { BlockMap, FlowCollection } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyCollection } from '../stringify/stringifyCollection.ts'
import { addPairToJSMap } from './addPairToJSMap.ts'
import {
  copyCollection,
  type CollectionBase,
  type NodeOf,
  type Primitive
} from './Collection.ts'
import { isNode } from './identity.ts'
import type { Node, Range } from './Node.ts'
import { Pair } from './Pair.ts'
import { Scalar } from './Scalar.ts'
import { ToJSContext } from './toJS.ts'

export type MapLike =
  | Map<any, any>
  | Set<any>
  | Record<string | number | symbol, any>

export function findPair<
  K extends Primitive | Node = Primitive | Node,
  V extends Primitive | Node = Primitive | Node
>(items: Iterable<Pair<K, V>>, key: unknown): Pair<K, V> | undefined {
  const k = key instanceof Scalar ? key.value : key
  for (const it of items) {
    if (it.key === key || it.key === k) return it
    if (it.key instanceof Scalar && it.key.value === k) return it
  }
  return undefined
}

export class YAMLMap<
  K extends Primitive | Node = Primitive | Node,
  V extends Primitive | Node = Primitive | Node
>
  extends Array<Pair<K, V>>
  implements CollectionBase
{
  schema: Schema | undefined

  /** An optional anchor on this collection. Used by alias nodes. */
  declare anchor?: string

  /**
   * If true, stringify this and all child nodes using flow rather than
   * block styles.
   */
  declare flow?: boolean

  /** A comment on or immediately after this collection. */
  declare comment?: string | null

  /** A comment before this collection. */
  declare commentBefore?: string | null

  /**
   * The `[start, value-end, node-end]` character offsets for
   * the part of the source parsed into this collection (undefined if not parsed).
   * The `value-end` and `node-end` positions are themselves not included in their respective ranges.
   */
  declare range?: Range | null

  /** A blank line before this collection and its commentBefore */
  declare spaceBefore?: boolean

  /** The CST token that was composed into this collection.  */
  declare srcToken?: BlockMap | FlowCollection

  /** A fully qualified tag, if required */
  declare tag?: string

  static get tagName(): 'tag:yaml.org,2002:map' {
    return 'tag:yaml.org,2002:map'
  }

  /**
   * A generic collection factory method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static create(nc: NodeCreator, obj: unknown): YAMLMap<any, any> {
    const { replacer } = nc
    const map = new this(nc.schema)
    const add = (key: unknown, value: unknown) => {
      if (typeof replacer === 'function') value = replacer.call(obj, key, value)
      else if (Array.isArray(replacer) && !replacer.includes(key)) return
      if (value !== undefined || nc.keepUndefined)
        map.push(nc.createPair(key, value))
    }
    if (obj instanceof Map) {
      for (const [key, value] of obj) add(key, value)
    } else if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) add(key, (obj as any)[key])
    }
    if (typeof nc.schema.sortMapEntries === 'function') {
      map.sort(nc.schema.sortMapEntries)
    }
    return map
  }

  constructor(schema?: Schema, elements: Array<Pair<K, V>> = []) {
    super(...elements)
    Object.defineProperty(this, 'schema', {
      value: schema,
      configurable: true,
      enumerable: false,
      writable: true
    })
  }

  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema?: Schema): this {
    return copyCollection(this, schema)
  }

  /**
   * Adds a key-value pair to the map.
   *
   * Using a key that is already in the collection overwrites the previous value.
   */
  add(pair: Pair<K, V>): void {
    if (!(pair instanceof Pair)) throw new TypeError('Expected a Pair')

    const prev = findPair(this, pair.key)
    const sortEntries = this.schema?.sortMapEntries
    if (prev) {
      // For scalars, keep the old node & its comments and anchors
      if (prev.value instanceof Scalar && pair.value instanceof Scalar)
        prev.value.value = pair.value.value
      else prev.value = pair.value
    } else if (sortEntries) {
      const i = this.findIndex(item => sortEntries(pair, item) < 0)
      if (i === -1) this.push(pair)
      else this.splice(i, 0, pair)
    } else {
      this.push(pair)
    }
  }

  delete(key: unknown): boolean {
    const it = findPair(this, key)
    if (!it) return false
    const del = this.splice(this.indexOf(it), 1)
    return del.length > 0
  }

  get(key: unknown): NodeOf<V> | undefined {
    const it = findPair(this, key)
    return it?.value ?? undefined
  }

  has(key: unknown): boolean {
    return !!findPair(this, key)
  }

  set(
    key: unknown,
    value: unknown,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    let pair: Pair
    if (isNode(key) && (value === null || isNode(value))) {
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
   * A plain JavaScript representation of this node.
   *
   * @param Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJS<T extends MapLike = Map<any, any>>(
    doc: Document<DocValue, boolean>,
    ctx: ToJSContext | undefined,
    Type: { new (): T }
  ): T
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): any
  toJS<T extends MapLike>(
    doc: Document<DocValue, boolean>,
    ctx?: ToJSContext,
    Type?: { new (): T }
  ) {
    ctx ??= new ToJSContext()
    const map = Type ? new Type() : ctx?.mapAsMap ? new Map() : {}
    if (this.anchor) ctx.setAnchor(this, map)
    for (const item of this) addPairToJSMap(doc, ctx, map, item)
    return map
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    for (const item of this) {
      if (!(item instanceof Pair))
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
