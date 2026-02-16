import type { Document, DocValue } from '../doc/Document.ts'
import type { Token } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../util.ts'
import type { Alias } from './Alias.ts'
import type { Scalar } from './Scalar.ts'
import type { ToJSContext } from './toJS.ts'
import type { YAMLMap } from './YAMLMap.ts'
import type { YAMLSeq } from './YAMLSeq.ts'

export type Node = Alias | Scalar | YAMLSeq | YAMLMap

/** Utility type mapper */
export type NodeType<T> = T extends
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  ? Scalar<T>
  : T extends Date
    ? Scalar<string | Date>
    : T extends Array<any>
      ? YAMLSeq<NodeType<T[number]>>
      : T extends { [key: string | number]: any }
        ? YAMLMap<NodeType<keyof T>, NodeType<T[keyof T]>>
        : Node

export type Range = [start: number, valueEnd: number, nodeEnd: number]

export interface NodeBase {
  /** A comment on or immediately after this */
  comment?: string | null

  /** A comment before this */
  commentBefore?: string | null

  /**
   * The `[start, value-end, node-end]` character offsets for the part of the
   * source parsed into this node (undefined if not parsed). The `value-end`
   * and `node-end` positions are themselves not included in their respective
   * ranges.
   */
  range?: Range | null

  /** A blank line before this node and its commentBefore */
  spaceBefore?: boolean

  /** The CST token that was composed into this node.  */
  srcToken?: Token

  /** A fully qualified tag, if required */
  tag?: string

  /**
   * Create a copy of this node.
   *
   * @param schema - If defined, overwrites the original's schema for cloned collections.
   */
  clone(schema?: Schema): this

  /** A plain JavaScript representation of this node. */
  toJS(doc: Document<DocValue, boolean>, opt?: ToJSContext): any

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}
