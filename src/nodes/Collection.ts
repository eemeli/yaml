import type { Schema } from '../schema/Schema.ts'
import type { Node, NodeBase } from './Node.ts'
import type { Pair } from './Pair.ts'
import type { Scalar } from './Scalar.ts'
import type { YAMLMap } from './YAMLMap.ts'
import type { YAMLSeq } from './YAMLSeq.ts'

export type Collection = YAMLMap | YAMLSeq

export type Primitive = boolean | number | bigint | string | null

export type NodeOf<T> = T extends Primitive ? Scalar<T> : T

export interface CollectionBase extends NodeBase {
  schema: Schema | undefined

  /** An optional anchor on this collection. Used by alias nodes. */
  anchor?: string

  /**
   * If true, stringify this and all child nodes using flow rather than
   * block styles.
   */
  flow?: boolean

  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema?: Schema): this

  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  delete(key: unknown): boolean

  /** Returns item at `key`, or `undefined` if not found.  */
  get(key: unknown): Node | Pair | undefined

  /** Checks if the collection includes a value with the key `key`.  */
  has(key: unknown): boolean

  /** Sets a value in this collection.  */
  set(key: unknown, value: unknown): void
}

export function copyCollection<T extends Collection>(
  orig: T,
  schema: Schema | undefined
): T {
  const copy = (orig.constructor as typeof YAMLMap).from(orig, it =>
    it.clone(schema)
  ) as typeof orig
  if (orig.range) copy.range = [...orig.range]
  const propDesc = Object.getOwnPropertyDescriptors(orig)
  for (const [name, prop] of Object.entries(propDesc)) {
    if (!(name in copy)) Object.defineProperty(copy, name, prop)
  }
  if (schema) copy.schema = schema
  return copy
}
