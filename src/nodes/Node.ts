import { applyReviver } from '../doc/applyReviver.ts'
import type { Document } from '../doc/Document.ts'
import type { ToJSOptions } from '../options.ts'
import type { Token } from '../parse/cst.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import type { Alias } from './Alias.ts'
import { isDocument, NODE_TYPE } from './identity.ts'
import type { Scalar } from './Scalar.ts'
import type { ToJSContext } from './toJS.ts'
import { toJS } from './toJS.ts'
import type { MapLike, YAMLMap } from './YAMLMap.ts'
import type { YAMLSeq } from './YAMLSeq.ts'

export type Node<T = unknown> =
  | Alias
  | Scalar<T>
  | YAMLMap<unknown, T>
  | YAMLSeq<T>

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
      : T extends { [key: string]: any }
        ? YAMLMap<NodeType<keyof T>, NodeType<T[keyof T]>>
        : T extends { [key: number]: any } // Merge with previous once supported in all TS versions
          ? YAMLMap<NodeType<keyof T>, NodeType<T[keyof T]>>
          : Node

export type ParsedNode =
  | Alias.Parsed
  | Scalar.Parsed
  | YAMLMap.Parsed
  | YAMLSeq.Parsed

/** `[start, value-end, node-end]` */
export type Range = [number, number, number]

export abstract class NodeBase {
  declare readonly [NODE_TYPE]: symbol

  /** A comment on or immediately after this */
  declare comment?: string | null

  /** A comment before this */
  declare commentBefore?: string | null

  /** A comment after key: */
  declare commentAfterKey?: string | null

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
    ctx: ToJSContext | undefined,
    map: MapLike,
    value: unknown
  ) => void

  /** A plain JS representation of this node */
  abstract toJSON(): any

  abstract toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string

  constructor(type: symbol) {
    Object.defineProperty(this, NODE_TYPE, { value: type })
  }

  /** Create a copy of this node.  */
  clone(): NodeBase {
    const copy: NodeBase = Object.create(
      Object.getPrototypeOf(this),
      Object.getOwnPropertyDescriptors(this)
    )
    if (this.range) copy.range = this.range.slice() as NodeBase['range']
    return copy
  }

  /** A plain JavaScript representation of this node. */
  toJS(
    doc: Document<Node, boolean>,
    { mapAsMap, maxAliasCount, onAnchor, reviver }: ToJSOptions = {}
  ): any {
    if (!isDocument(doc)) throw new TypeError('A document argument is required')
    const ctx: ToJSContext = {
      anchors: new Map(),
      doc,
      keep: true,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
    }
    const res = toJS(this, '', ctx)
    if (typeof onAnchor === 'function')
      for (const { count, res } of ctx.anchors.values()) onAnchor(res, count)
    return typeof reviver === 'function'
      ? applyReviver(reviver, { '': res }, '', res)
      : res
  }
}
