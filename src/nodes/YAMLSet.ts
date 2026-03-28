import type { Document, DocValue } from '../doc/Document.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { BlockMap, FlowCollection } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import { stringify, type StringifyContext } from '../stringify/stringify.ts'
import { indentComment, lineComment } from '../stringify/stringifyComment.ts'
import type { CollectionBase, NodeOf, Primitive } from './Collection.ts'
import { isCollection, isNode } from './identity.ts'
import type { Node, Range } from './Node.ts'
import { Scalar } from './Scalar.ts'
import { ToJSContext } from './toJS.ts'

function primitiveKey(value: unknown): Primitive | undefined {
  const value_ = value instanceof Scalar ? value.value : value
  switch (typeof value_) {
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'string':
      return value_
    default:
      return value_ ? undefined : null
  }
}

export class YAMLSet<
  T extends Primitive | Node = Primitive | Node
> implements CollectionBase {
  static readonly tagName = 'tag:yaml.org,2002:set'

  schema: Schema | undefined

  /** A fully qualified tag */
  tag = 'tag:yaml.org,2002:set'

  values: Map<Primitive | symbol, NodeOf<T>> = new Map()

  /** An optional anchor on this set. Used by alias nodes. */
  declare anchor?: string

  /** If true, stringify this and all child nodes using flow rather than block styles.  */
  declare flow?: boolean

  /** A comment on or immediately after this set. */
  declare comment?: string | null

  /** A comment before this set. */
  declare commentBefore?: string | null

  /**
   * The `[start, value-end, node-end]` character offsets for
   * the part of the source parsed into this set (undefined if not parsed).
   * The `value-end` and `node-end` positions are themselves not included in their respective ranges.
   */
  declare range?: Range | null

  /** A blank line before this set and its commentBefore */
  declare spaceBefore?: boolean

  /** The CST token that was composed into this set.  */
  declare srcToken?: BlockMap | FlowCollection

  constructor(schema?: Schema) {
    Object.defineProperty(this, 'schema', {
      value: schema,
      configurable: true,
      enumerable: false,
      writable: true
    })
  }

  get size(): number {
    return this.values.size
  }

  add(
    value: T | NodeOf<T>,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): this {
    if (this.has(value)) return this

    let node: Node
    if (isNode(value)) node = value
    else {
      if (!this.schema) throw new Error('Schema is required')
      const nc = new NodeCreator(this.schema, {
        ...options,
        aliasDuplicateObjects: false
      })
      node = nc.create(value)
      nc.setAnchors()
    }
    let key_: Primitive | symbol | undefined = primitiveKey(node)
    if (key_ === undefined) key_ = Symbol()
    this.values.set(key_, node as NodeOf<T>)
    return this
  }

  /**
   * Create a copy of this set.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema?: Schema): this {
    schema ??= this.schema
    const copy = new (this.constructor as typeof YAMLSet)(schema)
    for (const [key, value] of this.values) {
      copy.values.set(key, value.clone(schema))
    }
    if (this.range) copy.range = [...this.range]
    const propDesc = Object.getOwnPropertyDescriptors(this)
    for (const [name, prop] of Object.entries(propDesc)) {
      if (!(name in copy)) Object.defineProperty(copy, name, prop)
    }
    return copy as this
  }

  /**
   * Remove `value` from the set.
   * @returns `true` if the item was found and removed.
   */
  delete(value: T | NodeOf<T>): boolean {
    const pk = primitiveKey(value)
    if (pk !== undefined) return this.values.delete(pk)
    if (isNode(value)) {
      for (const [k, v] of this.values) {
        if (v === value) return this.values.delete(k)
      }
    }
    return false
  }

  /** Return the node matching `value`, if the set includes it.  */
  get(value: T | NodeOf<T>): NodeOf<T> | undefined {
    const pk = primitiveKey(value)
    if (pk !== undefined) return this.values.get(pk)
    if (isNode(value)) {
      for (const v of this.values.values()) if (v === value) return v
    }
    return undefined
  }

  /** Check if the set includes `value`.  */
  has(value: T | NodeOf<T>): boolean {
    const pk = primitiveKey(value)
    if (pk !== undefined) return this.values.has(pk)
    if (isNode(value)) {
      for (const v of this.values.values()) if (v === value) return true
    }
    return false
  }

  /**
   * Return the internal key matching `value`, or `undefined` if not found.
   *
   * @param allowMissing - If `true`, a key is always returned,
   *                       even if the value is not in the set.
   */
  keyOf(value: T | NodeOf<T>, allowMissing: true): Primitive | symbol
  keyOf(
    value: T | NodeOf<T>,
    allowMissing?: boolean
  ): Primitive | symbol | undefined
  keyOf(
    value: T | NodeOf<T>,
    allowMissing = false
  ): Primitive | symbol | undefined {
    const pk = primitiveKey(value)
    if (pk !== undefined)
      return allowMissing || this.values.has(pk) ? pk : undefined
    if (isNode(value)) {
      for (const [k, v] of this.values) if (v === value) return k
    }
    return allowMissing ? Symbol() : undefined
  }

  /** A plain JavaScript representation of this set. */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): Set<any> {
    ctx ??= new ToJSContext()
    const set = new Set()
    if (this.anchor) ctx.setAnchor(this, set)
    for (const item of this.values.values()) set.add(item.toJS(doc, ctx))
    return set
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    if (ctx.inFlow ?? this.flow) {
      return this.#stringifyFlowSet(ctx)
    } else {
      return this.#stringifyBlockSet(ctx, onComment, onChompKeep)
    }
  }

  #stringifyBlockSet(
    ctx: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ) {
    const {
      indent,
      indentStep,
      options: { commentString }
    } = ctx
    const itemCtx = {
      ...ctx,
      implicitKey: false,
      indent: indent + indentStep
    } satisfies StringifyContext

    let chompKeep = false // flag for the preceding node's status
    let res: string | null = null
    for (const item of this.values.values()) {
      if (!chompKeep && item.spaceBefore) {
        if (typeof res === 'string') res += '\n'
        else res = ''
      }
      let cb = item.commentBefore
      if (cb && chompKeep) cb = cb.replace(/^\n+/, '')
      if (cb) {
        const ic = indentComment(commentString(cb), indent).trimStart()
        if (typeof res === 'string') res += `\n${indent}${ic}`
        else res = ic
      }

      chompKeep = false
      let comment = item.comment
      let str = stringify(
        item,
        itemCtx,
        () => (comment = null),
        () => (chompKeep = true)
      )
      str = str ? `? ${str}` : '?'
      if (comment) {
        str += lineComment(str, itemCtx.indent, commentString(comment))
        chompKeep = false
      }
      if (typeof res === 'string') res += `\n${indent}${str}`
      else res = str
    }

    if (this.comment) {
      const cs = commentString(this.comment)
      if (typeof res === 'string') res += '\n' + indentComment(cs, indent)
      else res = '{}' + lineComment('', indent, cs)
      onComment?.()
    } else if (chompKeep) onChompKeep?.()

    return res ?? '{}'
  }

  #stringifyFlowSet(ctx: StringifyContext) {
    const {
      indent,
      indentStep,
      flowCollectionPadding: fcPadding,
      options: { commentString, lineWidth, trailingComma }
    } = ctx
    const itemCtx = {
      ...ctx,
      indent: indent + indentStep + indentStep,
      inFlow: true
    } satisfies StringifyContext

    let reqNewline = false
    const lines: string[] = []
    let itemsLeft = this.values.size
    let singleLineWidth = 2 * fcPadding.length // '{}' + ' ' + ' ' - ', '
    for (const item of this.values.values()) {
      itemsLeft -= 1

      if (item.spaceBefore) {
        lines.push('')
        reqNewline = true
      }
      if (item.commentBefore) {
        const ic = indentComment(commentString(item.commentBefore), indent)
        lines.push(ic.trimStart()) // Avoid double indent on first line
        reqNewline = true
      }
      let comment = item.comment
      if (comment) reqNewline = true

      itemCtx.implicitKey = !isCollection(item)
      let str = stringify(item, itemCtx, () => (comment = null)) || '?'
      if (isCollection(item)) str = `? ${str}`

      reqNewline ||= str.includes('\n')
      if (!reqNewline && lineWidth > 0) {
        singleLineWidth += str.length + 2 // str + ', '
        if (singleLineWidth > lineWidth) reqNewline = true
      }

      if (itemsLeft > 0 || (trailingComma && reqNewline)) str += ','
      if (comment)
        str += lineComment(str, indent + indentStep, commentString(comment))
      lines.push(str)
    }

    if (lines.length === 0) return '{}'
    if (!reqNewline) return `{${fcPadding}${lines.join(' ')}${fcPadding}}`
    let str = '{'
    for (const line of lines)
      str += line ? `\n${indentStep}${indent}${line}` : '\n'
    return `${str}\n${indent}}`
  }
}
