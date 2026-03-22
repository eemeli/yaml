import type { Document, DocValue } from '../doc/Document.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { BlockMap, FlowCollection } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import { stringifyCollection } from '../stringify/stringifyCollection.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
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
import { ToJSContext } from './toJS.ts'
import { findPair } from './YAMLMap.ts'

export class YAMLSet<T extends Primitive | Node = Primitive | Node>
  extends Array<Pair<T, T>>
  implements CollectionBase
{
  static tag = 'tag:yaml.org,2002:set'

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
  tag = 'tag:yaml.org,2002:set'

  static get tagName(): 'tag:yaml.org,2002:set' {
    return 'tag:yaml.org,2002:set'
  }

  constructor(schema?: Schema, elements: Array<Pair<T, T>> = []) {
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
  _push(pair: Pair<T, T>): void {
    super.push(pair)
  }

  /**
   * Add a value to the set.
   *
   * If a value of `items` is a Pair, its `.value` must be null.
   *
   * If the set already includes a matching value, no value is added.
   */
  push(...items: unknown[]): number {
    for (const value of items) {
      if (value instanceof Pair) {
        if (value.value !== null)
          throw new TypeError('set pair values must be null')
        const prev = findPair(this, value.key)
        if (!prev) super.push(value)
      } else {
        this.set(value, true)
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

  /** Returns the value matching `key`. */
  get(key: unknown): NodeOf<T> | undefined {
    const pair = findPair(this, key)
    return pair?.key
  }

  /** Checks if the mapping includes a value with the key `key`.  */
  has(key: unknown): boolean {
    return !!findPair(this, key)
  }

  /**
   * `value` needs to be true/false to add/remove the item from the set.
   */
  set(
    key: unknown,
    value: boolean,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    if (typeof value !== 'boolean')
      throw new Error(`Expected a boolean value, not ${typeof value}`)
    const prev = findPair(this, key)
    if (prev && !value) {
      this.splice(this.indexOf(prev), 1)
    } else if (!prev && value) {
      let node: Node
      if (isNode(key)) node = key
      else {
        if (!this.schema) throw new Error('Schema is required')
        const nc = new NodeCreator(this.schema, {
          ...options,
          aliasDuplicateObjects: false
        })
        node = nc.create(key)
        nc.setAnchors()
      }
      this.push(new Pair(node as NodeOf<T>))
    }
  }

  /** A plain JavaScript representation of this set. */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): Set<any> {
    ctx ??= new ToJSContext()
    const map = new Set()
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
    return stringifyCollection(
      this,
      { ...ctx, noValues: true },
      {
        blockItemPrefix: '',
        flowChars: { start: '{', end: '}' },
        itemIndent: ctx.indent || '',
        onChompKeep,
        onComment
      }
    )
  }
}
