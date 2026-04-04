import type { Document, DocValue } from '../doc/Document.ts'
import { NodeCreator } from '../doc/NodeCreator.ts'
import type { CreateNodeOptions } from '../options.ts'
import type { BlockSequence, FlowCollection } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { stringify } from '../stringify/stringify.ts'
import { indentComment, lineComment } from '../stringify/stringifyComment.ts'
import { isNode } from './identity.ts'
import { Pair } from './Pair.ts'
import { Scalar } from './Scalar.ts'
import { ToJSContext } from './toJS.ts'
import type { CollectionBase, Node, NodeOf, Primitive, Range } from './types.ts'

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

  declare schema: Schema

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

  constructor(schema: Schema, elements: Array<NodeOf<T>> = []) {
    super(...elements)
    Object.defineProperty(this, 'schema', {
      value: schema,
      configurable: true,
      enumerable: false,
      writable: true
    })
  }

  get size(): number {
    return this.length
  }

  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema?: Schema): this {
    const copy = (this.constructor as typeof YAMLSeq).from(this, it =>
      it.clone(schema)
    ) as typeof this
    if (this.range) copy.range = [...this.range]
    const propDesc = Object.getOwnPropertyDescriptors(this)
    for (const [name, prop] of Object.entries(propDesc)) {
      if (!(name in copy)) Object.defineProperty(copy, name, prop)
    }
    if (schema) copy.schema = schema
    return copy
  }

  /** @private */
  _push(item: NodeOf<T>): void {
    super.push(item)
  }

  /**
   * Append new elements to this sequence, and return its new length.
   *
   * Non-node values are converted to Node values.
   */
  push(...items: Array<T | NodeOf<T>>): number {
    let nc: NodeCreator | undefined
    for (const value of items) {
      if (isNode(value) || value instanceof Pair) {
        super.push(value as NodeOf<T>)
      } else {
        nc ??= new NodeCreator(this.schema, { aliasDuplicateObjects: false })
        super.push(nc.create(value) as NodeOf<T>)
        nc.setAnchors()
      }
    }
    return this.length
  }

  /**
   * Set a value in this sequence.
   *
   * Throws if `idx` is not an integer.
   */
  set(
    idx: number,
    value: T,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    if (!Number.isInteger(idx))
      throw new TypeError(`Expected an integer, not ${JSON.stringify(idx)}.`)
    const prev = this.at(idx)
    if (prev instanceof Scalar && isScalarValue(value)) prev.value = value
    else {
      let nv
      if (isNode(value) || value instanceof Pair) nv = value as NodeOf<T>
      else {
        const nc = new NodeCreator(this.schema, {
          ...options,
          aliasDuplicateObjects: false
        })
        nv = nc.create(value) as NodeOf<T>
        nc.setAnchors()
      }
      if (idx < 0) {
        if (idx < -this.length) throw new RangeError(`Invalid index ${idx}`)
        idx += this.length
      }
      this[idx] = nv
    }
  }

  /** A plain JavaScript representation of this node. */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): any[] {
    ctx ??= new ToJSContext()
    if (this.anchor) {
      const res: unknown[] = []
      if (this.anchor) ctx.setAnchor(this, res)
      for (const item of this) res.push(item.toJS(doc, ctx))
      return res
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array.from(this, item => item.toJS(doc, ctx))
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    return (ctx.inFlow ?? this.flow)
      ? this.#stringifyFlowSeq(ctx)
      : this.#stringifyBlockSeq(ctx, onComment, onChompKeep)
  }

  #stringifyBlockSeq(
    ctx: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ) {
    const {
      indent,
      options: { commentString }
    } = ctx
    const itemIndent = indent + '  '
    const itemCtx = { ...ctx, indent: itemIndent }

    let chompKeep = false // flag for the preceding node's status
    const lines: string[] = []
    for (let i = 0; i < this.length; ++i) {
      const item = this[i]
      let comment: string | null = null
      if (item instanceof Pair) {
        if (!chompKeep && item.key.spaceBefore) lines.push('')
        addCommentBefore(ctx, lines, item.key.commentBefore, chompKeep)
      } else if (item) {
        if (!chompKeep && item.spaceBefore) lines.push('')
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep)
        if (item.comment) comment = item.comment
      }

      chompKeep = false
      let str = stringify(
        item,
        itemCtx,
        () => (comment = null),
        () => (chompKeep = true)
      )
      if (comment) str += lineComment(str, itemIndent, commentString(comment))
      if (chompKeep && comment) chompKeep = false
      lines.push(`- ${str}`)
    }

    let str: string
    if (lines.length === 0) {
      str = '[]'
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

  #stringifyFlowSeq(ctx: StringifyContext) {
    const {
      indent,
      indentStep,
      flowCollectionPadding: fcPadding,
      options: { commentString }
    } = ctx
    const itemIndent = indent + '  ' + indentStep
    const itemCtx = { ...ctx, indent: itemIndent, inFlow: true }

    let reqNewline = false
    let linesAtValue = 0
    const lines: string[] = []
    for (let i = 0; i < this.length; ++i) {
      const item = this[i]
      let comment: string | null = null
      if (item instanceof Pair) {
        const ik = item.key
        if (ik.spaceBefore) lines.push('')
        addCommentBefore(ctx, lines, ik.commentBefore, false)
        if (ik.comment) reqNewline = true

        const iv = item.value
        if (iv) {
          if (iv.comment) comment = iv.comment
          if (iv.commentBefore) reqNewline = true
        } else if (ik?.comment) {
          comment = ik.comment
        }
      } else if (item) {
        if (item.spaceBefore) lines.push('')
        addCommentBefore(ctx, lines, item.commentBefore, false)
        if (item.comment) comment = item.comment
      }

      if (comment) reqNewline = true
      let str = stringify(item, itemCtx, () => (comment = null))
      reqNewline ||= lines.length > linesAtValue || str.includes('\n')
      if (i < this.length - 1) {
        str += ','
      } else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0) {
          reqNewline ||=
            lines.reduce((sum, line) => sum + line.length + 2, 2) +
              (str.length + 2) >
            ctx.options.lineWidth
        }
        if (reqNewline) {
          str += ','
        }
      }
      if (comment) str += lineComment(str, itemIndent, commentString(comment))
      lines.push(str)
      linesAtValue = lines.length
    }

    if (lines.length === 0) return '[]'
    if (!reqNewline) {
      const len = lines.reduce((sum, line) => sum + line.length + 2, 2)
      reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth
    }
    if (reqNewline) {
      let str = '['
      for (const line of lines)
        str += line ? `\n${indentStep}${indent}${line}` : '\n'
      return `${str}\n${indent}]`
    }
    return `[${fcPadding}${lines.join(' ')}${fcPadding}]`
  }
}

function addCommentBefore(
  { indent, options: { commentString } }: StringifyContext,
  lines: string[],
  comment: string | null | undefined,
  chompKeep: boolean
) {
  if (comment && chompKeep) comment = comment.replace(/^\n+/, '')
  if (comment) {
    const ic = indentComment(commentString(comment), indent)
    lines.push(ic.trimStart()) // Avoid double indent on first line
  }
}
