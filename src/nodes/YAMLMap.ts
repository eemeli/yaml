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

  /** @private */
  _push(pair: Pair<K, V>): void {
    super.push(pair)
  }

  /**
   * Adds new key-value pairs to the mapping, and returns its new length.
   *
   * Added pairs must not have the same keys as ones previously set in the map.
   */
  push(...pairs: Pair<K, V>[]): number {
    for (const pair of pairs) {
      if (!(pair instanceof Pair)) {
        const msg = `Expected a Pair, but found ${(pair as any).constructor?.name ?? pair}`
        throw new TypeError(msg)
      }
      if (findPair(this, pair.key)) {
        const msg = `Maps must not include duplicate keys: ${String(pair.key)}`
        throw new Error(msg)
      }

      if (this.schema?.sortMapEntries) {
        const sortEntries = this.schema.sortMapEntries
        const i = this.findIndex(item => sortEntries(pair, item) < 0)
        if (i === -1) super.push(pair)
        else this.splice(i, 0, pair)
      } else {
        super.push(pair)
      }
    }
    return this.length
  }

  /**
   * Removes a value from the mapping.
   * @returns `true` if the item was found and removed.
   */
  delete(key: unknown): boolean {
    const it = findPair(this, key)
    if (!it) return false
    const del = this.splice(this.indexOf(it), 1)
    return del.length > 0
  }

  /** Returns item at `key`, or `undefined` if not found.  */
  get(key: unknown): NodeOf<V> | undefined {
    const it = findPair(this, key)
    return it?.value ?? undefined
  }

  /** Checks if the mapping includes a value with the key `key`.  */
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
    } else {
      if (!this.schema) throw new Error('Schema is required')
      const nc = new NodeCreator(this.schema, {
        ...options,
        aliasDuplicateObjects: false
      })
      pair = nc.createPair(key, value)
      nc.setAnchors()
    }

    const prev = findPair(this, pair.key)
    if (prev) {
      const pv = pair.value as NodeOf<V>
      // For scalars, keep the old node & its comments and anchors
      if (prev.value instanceof Scalar && pv instanceof Scalar) {
        Object.assign(prev.value, pv)
      } else prev.value = pv
    } else if (this.schema?.sortMapEntries) {
      const sortEntries = this.schema.sortMapEntries
      const i = this.findIndex(item => sortEntries(pair, item) < 0)
      if (i === -1) super.push(pair as Pair<K, V>)
      else this.splice(i, 0, pair as Pair<K, V>)
    } else {
      super.push(pair as Pair<K, V>)
    }
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
