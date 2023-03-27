import { createNode } from '../doc/createNode.js'
import type { Schema } from '../schema/Schema.js'
import {
  isCollection,
  isNode,
  isPair,
  isScalar,
  NODE_TYPE
} from './identity.js'
import { NodeBase } from './Node.js'

export function collectionFromPath(
  schema: Schema,
  path: unknown[],
  value: unknown
) {
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
  return createNode(v, undefined, {
    aliasDuplicateObjects: false,
    keepUndefined: false,
    onAnchor: () => {
      throw new Error('This should not happen, please report a bug.')
    },
    schema,
    sourceObjects: new Map()
  })
}

// Type guard is intentionally a little wrong so as to be more useful,
// as it does not cover untypable empty non-string iterables (e.g. []).
export const isEmptyPath = (
  path: Iterable<unknown> | null | undefined
): path is null | undefined =>
  path == null ||
  (typeof path === 'object' && !!path[Symbol.iterator]().next().done)

export abstract class Collection extends NodeBase {
  static maxFlowStringSingleLineLength = 60

  schema: Schema | undefined;

  declare [NODE_TYPE]: symbol

  declare items: unknown[]

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
    copy.items = copy.items.map(it =>
      isNode(it) || isPair(it) ? it.clone(schema) : it
    )
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
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  abstract set(key: unknown, value: unknown): void

  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(path: Iterable<unknown>, value: unknown) {
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

  hasAllNullValues(allowScalar?: boolean) {
    return this.items.every(node => {
      if (!isPair(node)) return false
      const n = node.value
      return (
        n == null ||
        (allowScalar &&
          isScalar(n) &&
          n.value == null &&
          !n.commentBefore &&
          !n.comment &&
          !n.tag)
      )
    })
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
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path: Iterable<unknown>, value: unknown) {
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
