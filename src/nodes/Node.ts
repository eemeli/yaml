import type { Document, DocValue } from '../doc/Document.ts'
import type { Token } from '../parse/cst.ts'
import type { Schema } from '../schema/Schema.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import type { Alias } from './Alias.ts'
import type { Scalar } from './Scalar.ts'
import type { ToJSContext } from './toJS.ts'
import type { MapLike, YAMLMap } from './YAMLMap.ts'
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

export abstract class NodeBase {
  /** A comment on or immediately after this */
  declare comment?: string | null

  /** A comment before this */
  declare commentBefore?: string | null

  /**
   * The `[start, value-end, node-end]` character offsets for the part of the
   * source parsed into this node (undefined if not parsed). The `value-end`
   * and `node-end` positions are themselves not included in their respective
   * ranges.
   */
  declare range?: Range | null

  /** A blank line before this node and its commentBefore */
  declare spaceBefore?: boolean

  /** The CST token that was composed into this node.  */
  declare srcToken?: Token

  /** A fully qualified tag, if required */
  declare tag?: string

  /**
   * Customize the way that a key-value pair is resolved.
   * Used for YAML 1.1 !!merge << handling.
   */
  declare addToJSMap?: (
    doc: Document<DocValue, boolean>,
    ctx: ToJSContext | undefined,
    map: MapLike,
    value: unknown
  ) => void

  /** A plain JavaScript representation of this node. */
  abstract toJS(doc: Document<DocValue, boolean>, opt?: ToJSContext): any

  abstract toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string

  /** Create a copy of this node.  */
  clone(_schema?: Schema): NodeBase {
    const copy: NodeBase = Object.create(
      Object.getPrototypeOf(this),
      Object.getOwnPropertyDescriptors(this)
    )
    if (this.range) copy.range = this.range.slice() as NodeBase['range']
    return copy
  }
}
