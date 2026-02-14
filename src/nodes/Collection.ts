import type { Token } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { Node, Range } from './Node.ts'
import type { Pair } from './Pair.ts'
import type { Scalar } from './Scalar.ts'

export type Primitive = boolean | number | bigint | string | null
export type NodeOf<T> = T extends Primitive ? Scalar<T> : T

export abstract class Collection {
  schema: Schema | undefined

  declare items: (Node | Pair)[]

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
  declare srcToken?: Token

  /** A fully qualified tag, if required */
  declare tag?: string

  constructor(schema?: Schema) {
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
    const copy: this = Object.create(
      Object.getPrototypeOf(this),
      Object.getOwnPropertyDescriptors(this)
    )
    if (schema) copy.schema = schema
    copy.items = copy.items.map(it => it.clone(schema))
    if (this.range) copy.range = [...this.range]
    return copy
  }

  /** Adds a value to the collection. */
  abstract add(value: unknown): void

  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  abstract delete(key: unknown): boolean

  /**
   * Returns item at `key`, or `undefined` if not found.
   */
  abstract get(key: unknown): Node | Pair | undefined

  /**
   * Checks if the collection includes a value with the key `key`.
   */
  abstract has(key: unknown): boolean

  /**
   * Sets a value in this collection.
   */
  abstract set(key: unknown, value: unknown): void
}
