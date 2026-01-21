import { NodeCreator } from '../doc/NodeCreator.ts'
import type { Schema } from '../schema/Schema.ts'
import { isCollection, isScalar, NODE_TYPE } from './identity.ts'
import { type Node, NodeBase } from './Node.ts'
import type { Pair } from './Pair.ts'
import type { Scalar } from './Scalar.ts'

export type Primitive = boolean | number | bigint | string | null
export type NodeOf<T> = T extends Primitive ? Scalar<T> : T

export function collectionFromPath(
  schema: Schema,
  path: unknown[],
  value: unknown
): Node {
  let v = value
  for (let i = path.length - 1; i >= 0; --i) {
    const k = path[i]
    if (typeof k === 'number' && Number.isInteger(k) && k >= 0) {
      const a: unknown[] = []
      a[k] = v
      v = a
    } else {
      v = new Map<unknown, unknown>([[k, v]])
    }
  }
  return new NodeCreator(schema, { aliasDuplicateObjects: false }).create(v)
}

// Type guard is intentionally a little wrong so as to be more useful,
// as it does not cover untypable empty non-string iterables (e.g. []).
export const isEmptyPath = (
  path: Iterable<unknown> | null | undefined
): path is null | undefined =>
  path == null ||
  (typeof path === 'object' && !!path[Symbol.iterator]().next().done)

export abstract class Collection extends NodeBase {
  schema: Schema | undefined;

  /** @internal */
  declare [NODE_TYPE]: symbol

  declare items: (NodeBase | Pair)[]

  /** An optional anchor on this node. Used by alias nodes. */
  declare anchor?: string

  /**
   * If true, stringify this and all child nodes using flow rather than
   * block styles.
   */
  declare flow?: boolean

  constructor(type: symbol, schema?: Schema) {
    super(type)
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
  clone(schema?: Schema): Collection {
    const copy: Collection = Object.create(
      Object.getPrototypeOf(this),
      Object.getOwnPropertyDescriptors(this)
    )
    if (schema) copy.schema = schema
    copy.items = copy.items.map(it => it.clone(schema))
    if (this.range) copy.range = this.range.slice() as NodeBase['range']
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
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  abstract get(key: unknown, keepScalar?: boolean): unknown

  /**
   * Checks if the collection includes a value with the key `key`.
   */
  abstract has(key: unknown): boolean

  /**
   * Sets a value in this collection.
   */
  abstract set(key: unknown, value: unknown): void

  /**
   * Adds a value to the collection.
   *
   * For `!!map` and `!!omap` the value must be a Pair instance.
   */
  addIn(path: Iterable<unknown>, value: unknown): void {
    if (isEmptyPath(path)) this.add(value)
    else {
      const [key, ...rest] = path
      const node = this.get(key, true)
      if (isCollection(node)) node.addIn(rest, value)
      else if (node === undefined && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value))
      else
        throw new Error(
          `Expected YAML collection at ${key}. Remaining path: ${rest}`
        )
    }
  }

  /**
   * Removes a value from the collection.
   *
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path: Iterable<unknown>): boolean {
    const [key, ...rest] = path
    if (rest.length === 0) return this.delete(key)
    const node = this.get(key, true)
    if (isCollection(node)) return node.deleteIn(rest)
    else
      throw new Error(
        `Expected YAML collection at ${key}. Remaining path: ${rest}`
      )
  }

  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path: Iterable<unknown>, keepScalar?: boolean): unknown {
    const [key, ...rest] = path
    const node = this.get(key, true)
    if (rest.length === 0)
      return !keepScalar && isScalar(node) ? node.value : node
    else return isCollection(node) ? node.getIn(rest, keepScalar) : undefined
  }

  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(path: Iterable<unknown>): boolean {
    const [key, ...rest] = path
    if (rest.length === 0) return this.has(key)
    const node = this.get(key, true)
    return isCollection(node) ? node.hasIn(rest) : false
  }

  /**
   * Sets a value in this collection.
   */
  setIn(path: Iterable<unknown>, value: unknown): void {
    const [key, ...rest] = path
    if (rest.length === 0) {
      this.set(key, value)
    } else {
      const node = this.get(key, true)
      if (isCollection(node)) node.setIn(rest, value)
      else if (node === undefined && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value))
      else
        throw new Error(
          `Expected YAML collection at ${key}. Remaining path: ${rest}`
        )
    }
  }
}
