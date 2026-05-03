import type { Document, DocValue } from '../doc/Document.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { BlockMap, FlowCollection } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { indentComment, lineComment } from '../stringify/stringifyComment.ts'
import { stringifyPair } from '../stringify/stringifyPair.ts'
import { addPairToJSMap } from './addPairToJSMap.ts'
import { isNode } from './identity.ts'
import { Pair } from './Pair.ts'
import { Scalar } from './Scalar.ts'
import { ToJSContext } from './toJS.ts'
import type { CollectionBase, Node, NodeOf, Primitive, Range } from './types.ts'
import { cloneMapOrSet } from './util-clone-map-or-set.ts'

export type MapLike =
  | Map<any, any>
  | Set<any>
  | Record<string | number | symbol, any>

export type KeyArg<K extends Primitive | Node, V extends Primitive | Node> =
  | K
  | NodeOf<K>
  | (K extends Scalar ? K['value'] : never)
  | Pair<K, V>

export class YAMLMap<
  K extends Primitive | Node = Primitive | Node,
  V extends Primitive | Node = Primitive | Node
> implements CollectionBase {
  static readonly tagName = 'tag:yaml.org,2002:map'

  declare schema: Schema

  values: Map<unknown, Pair<K, V>> = new Map()

  /** An optional anchor on this map. Used by alias nodes. */
  declare anchor?: string

  /** If true, stringify this and all child nodes using flow rather than block styles. */
  declare flow?: boolean

  /** A comment on or immediately after this map. */
  declare comment?: string | null

  /** A comment before this map. */
  declare commentBefore?: string | null

  /**
   * The `[start, value-end, node-end]` character offsets for
   * the part of the source parsed into this map (undefined if not parsed).
   * The `value-end` and `node-end` positions are themselves not included in their respective ranges.
   */
  declare range?: Range | null

  /** A blank line before this map and its commentBefore */
  declare spaceBefore?: boolean

  /** The CST token that was composed into this map.  */
  declare srcToken?: BlockMap | FlowCollection

  /** A fully qualified tag, if required */
  declare tag?: string

  /**
   * A generic collection factory method that can be used
   * by other node classes that inherit from YAMLMap
   */
  static create(nc: NodeCreator, obj: unknown): YAMLMap<any, any> {
    const { replacer } = nc
    const map = new this(nc.schema)
    if (obj && typeof obj === 'object') {
      const iter = obj instanceof Map ? obj : Object.entries(obj)
      for (let [key, value] of iter) {
        if (replacer) {
          if (typeof replacer === 'function')
            value = replacer.call(obj, key, value)
          else if (Array.isArray(replacer) && !replacer.includes(key)) continue
        }
        if (value !== undefined || nc.keepUndefined) {
          const mk = nc.schema.mapKey(key)
          const pair = nc.createPair(key, value)
          map.values.set(mk, pair)
        }
      }
    }
    return map
  }

  constructor(schema: Schema, elements?: Array<Pair<K, V>>) {
    Object.defineProperty(this, 'schema', {
      value: schema,
      configurable: true,
      enumerable: false,
      writable: true
    })
    this.values = new Map(
      elements?.map(pair => [this.schema.mapKey(pair), pair])
    )
  }

  get size(): number {
    return this.values.size
  }

  /**
   * Create a copy of this map.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema?: Schema): this {
    return cloneMapOrSet(this, schema)
  }

  /**
   * Remove a value from the mapping.
   * @returns `true` if the item was found and removed.
   */
  delete(key: KeyArg<K, V>): boolean {
    let mk = this.schema.mapKey(key)
    if (this.values.delete(mk)) return true
    mk = key instanceof Pair ? key.key : isNode(key) ? key : null
    if (mk) {
      for (const [k, p] of this.values)
        if (p.key === mk) return this.values.delete(k)
    }
    return false
  }

  /** Return value at `key`, or `undefined` if not found.  */
  get(key: KeyArg<K, V>): NodeOf<V> | null | undefined {
    return this.getPair(key)?.value
  }

  /** Return pair at `key`, or `undefined` if not found.  */
  getPair(key: KeyArg<K, V>): Pair<K, V> | undefined {
    let mk = this.schema.mapKey(key)
    const pair = this.values.get(mk)
    if (pair) return pair
    mk = key instanceof Pair ? key.key : isNode(key) ? key : null
    if (mk) {
      for (const p of this.values.values()) if (p.key === mk) return p
    }
    return undefined
  }

  /** Check if the mapping includes a value with the key `key`.  */
  has(key: KeyArg<K, V>): boolean {
    let mk = this.schema.mapKey(key)
    if (this.values.has(mk)) return true
    mk = key instanceof Pair ? key.key : isNode(key) ? key : null
    if (mk) {
      for (const p of this.values.values()) if (p.key === mk) return true
    }
    return false
  }

  /**
   * Return the internal Map key matching `key`, or `undefined` if not found.
   *
   * @param allowMissing - If `true`, a key is always returned,
   *                       even if the key is not in the map.
   */
  keyOf(key: KeyArg<K, V>, allowMissing = false): unknown {
    let mk = this.schema.mapKey(key)
    if (allowMissing || this.values.has(mk)) return mk
    mk = key instanceof Pair ? key.key : isNode(key) ? key : null
    if (mk) {
      for (const [k, v] of this.values) if (v.key === mk) return k
    }
    return undefined
  }

  pairs(): Iterable<Pair<K, V>> {
    return this.values.values()
  }

  set(
    key: K | NodeOf<K> | (K extends Scalar ? K['value'] : never),
    value: V | NodeOf<V> | (V extends Scalar ? V['value'] : never) | null,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): this
  set(pair: Pair<K, V>): this
  set(
    keyOrPair: KeyArg<K, V>,
    value?: V | NodeOf<V> | (V extends Scalar ? V['value'] : never) | null,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): this {
    const mk = this.schema.mapKey(keyOrPair)

    let pair: Pair<K, V>
    if (keyOrPair instanceof Pair) {
      pair = keyOrPair
    } else if (isNode(keyOrPair) && (value == null || isNode(value))) {
      pair = new Pair(keyOrPair, value ?? null)
    } else {
      const nc = new NodeCreator(this.schema, options)
      pair = nc.createPair(keyOrPair, value) as Pair<K, V>
    }

    if (pair.value instanceof Scalar) {
      const prev = this.values.get(mk)
      if (prev) {
        if (!prev.value) {
          prev.value = pair.value
          return this
        }
        if (prev.value instanceof Scalar) {
          // For scalars, keep the old node & its comments and anchors
          Object.assign(prev.value, pair.value)
          return this
        }
      }
    }
    this.values.set(mk, pair)
    return this
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
    const map = Type
      ? new Type()
      : ctx?.mapAsMap
        ? new Map()
        : (Object.create(null) as Record<string, unknown>)
    if (this.anchor) ctx.setAnchor(this, map)
    for (const pair of this.values.values()) addPairToJSMap(doc, ctx, map, pair)
    return map
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    let pairs: Iterable<Pair<K, V>> = this.values.values()
    if (ctx.sortMapEntries) pairs = Array.from(pairs).sort(ctx.sortMapEntries)
    return (ctx.inFlow ?? this.flow)
      ? this.#stringifyFlowMap(ctx, pairs)
      : this.#stringifyBlockMap(ctx, pairs, onComment, onChompKeep)
  }

  #stringifyBlockMap(
    ctx: StringifyContext,
    pairs: Iterable<Pair<K, V>>,
    onComment?: () => void,
    onChompKeep?: () => void
  ) {
    const {
      indent,
      options: { commentString }
    } = ctx

    let chompKeep = false // flag for the preceding node's status
    const lines: string[] = []
    for (const pair of pairs) {
      let comment: string | null = null
      if (!chompKeep && pair.key.spaceBefore) lines.push('')

      let cb = pair.key.commentBefore
      if (cb && chompKeep) cb = cb.replace(/^\n+/, '')
      if (cb) {
        const ic = indentComment(commentString(cb), indent).trimStart()
        lines.push(ic)
      }

      chompKeep = false
      let str = stringifyPair(
        pair,
        ctx,
        () => (comment = null),
        () => (chompKeep = true)
      )
      if (comment) str += lineComment(str, indent, commentString(comment))
      if (chompKeep && comment) chompKeep = false
      lines.push(str)
    }

    let str: string
    if (lines.length === 0) {
      str = '{}'
    } else {
      str = lines[0]
      for (let i = 1; i < lines.length; ++i) {
        const line = lines[i]
        str += line ? `\n${indent}${line}` : '\n'
      }
    }

    if (this.comment) {
      str += '\n' + indentComment(commentString(this.comment), indent)
      onComment?.()
    } else if (chompKeep) onChompKeep?.()

    return str
  }

  #stringifyFlowMap(ctx: StringifyContext, pairs: Iterable<Pair<K, V>>) {
    const {
      indent,
      indentStep,
      flowCollectionPadding: fcPadding,
      options: { commentString, lineWidth, trailingComma }
    } = ctx
    const itemIndent = indent + indentStep
    const itemCtx = { ...ctx, indent: itemIndent, inFlow: true }

    let reqNewline = false
    let linesAtValue = 0
    const lines: string[] = []
    let itemsLeft = this.values.size
    for (const pair of pairs) {
      itemsLeft -= 1

      let comment: string | null = null
      const ik = pair.key
      if (ik.spaceBefore) {
        lines.push('')
        reqNewline = true
      }
      if (ik.commentBefore) {
        const ic = indentComment(commentString(ik.commentBefore), indent)
        lines.push(ic.trimStart()) // Avoid double indent on first line
        reqNewline = true
      }
      if (ik.comment) reqNewline = true

      const iv = pair.value
      if (iv) {
        if (iv.comment) comment = iv.comment
        if (iv.commentBefore) reqNewline = true
      } else if (ik?.comment) {
        comment = ik.comment
      }

      if (comment) reqNewline = true
      let str = stringifyPair(pair, itemCtx, () => (comment = null))
      reqNewline ||= lines.length > linesAtValue || str.includes('\n')
      if (itemsLeft > 0) {
        str += ','
      } else if (trailingComma) {
        if (!reqNewline && lineWidth > 0) {
          const len =
            lines.reduce((sum, line) => sum + line.length + 2, 2) +
            (str.length + 2)
          reqNewline = len > lineWidth
        }
        if (reqNewline) str += ','
      }
      if (comment) str += lineComment(str, itemIndent, commentString(comment))
      lines.push(str)
      linesAtValue = lines.length
    }

    if (lines.length === 0) return '{}'
    if (!reqNewline) {
      const len = lines.reduce((sum, line) => sum + line.length + 2, 2)
      reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth
    }
    if (reqNewline) {
      let str = '{'
      for (const line of lines)
        str += line ? `\n${indentStep}${indent}${line}` : '\n'
      return `${str}\n${indent}}`
    }
    return `{${fcPadding}${lines.join(' ')}${fcPadding}}`
  }
}
