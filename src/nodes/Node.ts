import type { Document } from '../doc/Document.js'
import { Token } from '../parse/cst.js'
import type { StringifyContext } from '../stringify/stringify.js'
import type { Alias } from './Alias.js'
import type { Pair } from './Pair.js'
import type { Scalar } from './Scalar.js'
import type { YAMLMap } from './YAMLMap.js'
import type { YAMLSeq } from './YAMLSeq.js'

export type Node<T = unknown> =
  | Alias
  | Scalar<T>
  | YAMLMap<unknown, T>
  | YAMLSeq<T>

/** Utility type mapper */
export type NodeType<T> = T extends string | number | bigint | boolean | null
  ? Scalar<T>
  : T extends Array<any>
  ? YAMLSeq<NodeType<T[number]>>
  : T extends { [key: string | number]: any }
  ? YAMLMap<NodeType<keyof T>, NodeType<T[keyof T]>>
  : Node

export type ParsedNode =
  | Alias.Parsed
  | Scalar.Parsed
  | YAMLMap.Parsed
  | YAMLSeq.Parsed

export type Range = [number, number, number]

export const ALIAS = Symbol.for('yaml.alias')
export const DOC = Symbol.for('yaml.document')
export const MAP = Symbol.for('yaml.map')
export const PAIR = Symbol.for('yaml.pair')
export const SCALAR = Symbol.for('yaml.scalar')
export const SEQ = Symbol.for('yaml.seq')
export const NODE_TYPE = Symbol.for('yaml.node.type')

export const isAlias = (node: any): node is Alias =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === ALIAS

export const isDocument = <T extends Node = Node>(
  node: any
): node is Document<T> =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === DOC

export const isMap = <K = unknown, V = unknown>(
  node: any
): node is YAMLMap<K, V> =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === MAP

export const isPair = <K = unknown, V = unknown>(
  node: any
): node is Pair<K, V> =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === PAIR

export const isScalar = <T = unknown>(node: any): node is Scalar<T> =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === SCALAR

export const isSeq = <T = unknown>(node: any): node is YAMLSeq<T> =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === SEQ

export function isCollection<K = unknown, V = unknown>(
  node: any
): node is YAMLMap<K, V> | YAMLSeq<V> {
  if (node && typeof node === 'object')
    switch (node[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return true
    }
  return false
}

export function isNode<T = unknown>(node: any): node is Node<T> {
  if (node && typeof node === 'object')
    switch (node[NODE_TYPE]) {
      case ALIAS:
      case MAP:
      case SCALAR:
      case SEQ:
        return true
    }
  return false
}

export const hasAnchor = <K = unknown, V = unknown>(
  node: unknown
): node is Scalar<V> | YAMLMap<K, V> | YAMLSeq<V> =>
  (isScalar(node) || isCollection(node)) && !!node.anchor

export abstract class NodeBase {
  declare readonly [NODE_TYPE]: symbol

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
}
