import type { Document, DocValue } from '../doc/Document.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { BlockSequence, FlowCollection } from '../parse/cst.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringifyCollection } from '../stringify/stringifyCollection.ts'
import { Collection, type NodeOf, type Primitive } from './Collection.ts'
import { NodeBase } from './Node.ts'
import type { Pair } from './Pair.ts'
import { Scalar } from './Scalar.ts'
import { ToJSContext } from './toJS.ts'

const isScalarValue = (value: unknown): boolean =>
  !value || (typeof value !== 'function' && typeof value !== 'object')

export class YAMLSeq<
  T extends Primitive | NodeBase | Pair = Primitive | NodeBase | Pair
> extends Collection {
  static get tagName(): 'tag:yaml.org,2002:seq' {
    return 'tag:yaml.org,2002:seq'
  }

  items: NodeOf<T>[] = []
  declare srcToken?: BlockSequence | FlowCollection

  add(
    value: T,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    if (value instanceof NodeBase) this.items.push(value as NodeOf<T>)
    else if (!this.schema) throw new Error('Schema is required')
    else {
      const nc = new NodeCreator(this.schema, {
        ...options,
        aliasDuplicateObjects: false
      })
      this.items.push(nc.create(value) as NodeOf<T>)
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
    const del = this.items.splice(idx, 1)
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
    return this.items[idx]
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
    return idx < this.items.length
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
    const prev = this.items[idx]
    if (prev instanceof Scalar && isScalarValue(value)) prev.value = value
    else if (value instanceof NodeBase) this.items[idx] = value as NodeOf<T>
    else if (!this.schema) throw new Error('Schema is required')
    else {
      const nc = new NodeCreator(this.schema, {
        ...options,
        aliasDuplicateObjects: false
      })
      this.items[idx] = nc.create(value) as NodeOf<T>
      nc.setAnchors()
    }
  }

  /** A plain JavaScript representation of this node. */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): any[] {
    ctx ??= new ToJSContext()
    const res: unknown[] = []
    if (this.anchor) ctx.setAnchor(this, res)
    for (const item of this.items) res.push(item.toJS(doc, ctx))
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

  static from(nc: NodeCreator, obj: unknown): YAMLSeq {
    const seq = new this(nc.schema)
    if (obj && Symbol.iterator in Object(obj)) {
      let i = 0
      for (let it of obj as Iterable<unknown>) {
        if (typeof nc.replacer === 'function') {
          const key = obj instanceof Set ? it : String(i++)
          it = nc.replacer.call(obj, key, it)
        }
        seq.items.push(nc.create(it))
      }
    }
    return seq
  }
}
