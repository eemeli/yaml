import type { Document, DocValue } from '../doc/Document.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { BlockSequence, FlowCollection } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyCollection } from '../stringify/stringifyCollection.ts'
import { copyCollection, type CollectionBase, type NodeOf, type Primitive } from './Collection.ts'
import { isNode } from './identity.ts'
import type { Node, Range } from './Node.ts'
import type { Pair } from './Pair.ts'
import { Scalar } from './Scalar.ts'
import { ToJSContext } from './toJS.ts'

const isScalarValue = (value: unknown): boolean =>
  !value || (typeof value !== 'function' && typeof value !== 'object')

export class YAMLSeq<
  T extends Primitive | Node | Pair = Primitive | Node | Pair
>
  extends Array<NodeOf<T>>
  implements CollectionBase
{
  static get tagName(): 'tag:yaml.org,2002:seq' {
    return 'tag:yaml.org,2002:seq'
  }

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
  declare srcToken?: BlockSequence | FlowCollection

  /** A fully qualified tag, if required */
  declare tag?: string

  /**
   * A generic collection factory method that can be extended
   * to other node classes that inherit from YAMLSeq
   */
  static create(nc: NodeCreator, obj: unknown): YAMLSeq {
    const seq = new this(nc.schema)
    if (obj && Symbol.iterator in Object(obj)) {
      let i = 0
      for (let it of obj as Iterable<unknown>) {
        if (typeof nc.replacer === 'function') {
          const key = obj instanceof Set ? it : String(i++)
          it = nc.replacer.call(obj, key, it)
        }
        seq.push(nc.create(it))
      }
    }
    return seq
  }

  constructor(schema?: Schema, elements: Array<NodeOf<T>> = []) {
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

  add(
    value: T,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    if (isNode(value)) this.push(value as NodeOf<T>)
    else if (!this.schema) throw new Error('Schema is required')
    else {
      const nc = new NodeCreator(this.schema, {
        ...options,
        aliasDuplicateObjects: false
      })
      this.push(nc.create(value) as NodeOf<T>)
      nc.setAnchors()
    }
  }

  /**
   * Removes a value from the collection.
   *
   * Throws if `idx` is not a non-negative integer.
   *
   * @returns `true` if the item was found and removed.
   */
  delete(idx: number): boolean {
    if (!Number.isInteger(idx))
      throw new TypeError(`Expected an integer, not ${idx}.`)
    if (idx < 0) throw new RangeError(`Invalid negative index ${idx}`)
    const del = this.splice(idx, 1)
    return del.length > 0
  }

  /**
   * Returns item at `key`, or `undefined` if not found.
   *
   * Throws if `idx` is not a non-negative integer.
   */
  get(idx: number): NodeOf<T> | undefined {
    if (!Number.isInteger(idx))
      throw new TypeError(`Expected an integer, not ${JSON.stringify(idx)}.`)
    if (idx < 0) throw new RangeError(`Invalid negative index ${idx}`)
    return this[idx]
  }

  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * Throws if `idx` is not a non-negative integer.
   */
  has(idx: number): boolean {
    if (!Number.isInteger(idx))
      throw new TypeError(`Expected an integer, not ${JSON.stringify(idx)}.`)
    if (idx < 0) throw new RangeError(`Invalid negative index ${idx}`)
    return idx < this.length
  }

  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   *
   * Throws if `idx` is not a non-negative integer.
   */
  set(
    idx: number,
    value: T,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    if (!Number.isInteger(idx))
      throw new TypeError(`Expected an integer, not ${JSON.stringify(idx)}.`)
    if (idx < 0) throw new RangeError(`Invalid negative index ${idx}`)
    const prev = this[idx]
    if (prev instanceof Scalar && isScalarValue(value)) prev.value = value
    else if (isNode(value)) this[idx] = value as NodeOf<T>
    else if (!this.schema) throw new Error('Schema is required')
    else {
      const nc = new NodeCreator(this.schema, {
        ...options,
        aliasDuplicateObjects: false
      })
      this[idx] = nc.create(value) as NodeOf<T>
      nc.setAnchors()
    }
  }

  /** A plain JavaScript representation of this node. */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): any[] {
    ctx ??= new ToJSContext()
    const res: unknown[] = []
    if (this.anchor) ctx.setAnchor(this, res)
    for (const item of this) res.push(item.toJS(doc, ctx))
    return res
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    return stringifyCollection(this, ctx, {
      blockItemPrefix: '- ',
      flowChars: { start: '[', end: ']' },
      itemIndent: (ctx.indent || '') + '  ',
      onChompKeep,
      onComment
    })
  }
}
