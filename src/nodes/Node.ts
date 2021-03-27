import type { Document } from '../doc/Document.js'
import type { StringifyContext } from '../stringify/stringify.js'
import type { Alias } from './Alias.js'
import type { Pair } from './Pair.js'
import type { Scalar } from './Scalar.js'
import type { YAMLMap } from './YAMLMap.js'
import type { YAMLSeq } from './YAMLSeq.js'

export type Node = Alias | Scalar | YAMLMap | YAMLSeq

export type ParsedNode =
  | Alias.Parsed
  | Scalar.Parsed
  | YAMLMap.Parsed
  | YAMLSeq.Parsed

export const ALIAS = Symbol.for('yaml.alias')
export const DOC = Symbol.for('yaml.document')
export const MAP = Symbol.for('yaml.map')
export const PAIR = Symbol.for('yaml.pair')
export const SCALAR = Symbol.for('yaml.scalar')
export const SEQ = Symbol.for('yaml.seq')
export const NODE_TYPE = Symbol.for('yaml.node.type')

export const isAlias = (node: any): node is Alias =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === ALIAS

export const isDocument = (node: any): node is Document =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === DOC

export const isMap = (node: any): node is YAMLMap =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === MAP

export const isPair = (node: any): node is Pair =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === PAIR

export const isScalar = (node: any): node is Scalar =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === SCALAR

export const isSeq = (node: any): node is YAMLSeq =>
  !!node && typeof node === 'object' && node[NODE_TYPE] === SEQ

export function isCollection(node: any): node is YAMLMap | YAMLSeq {
  if (node && typeof node === 'object')
    switch (node[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return true
    }
  return false
}

export function isNode(node: any): node is Node {
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

export const hasAnchor = (node: unknown): node is Scalar | YAMLMap | YAMLSeq =>
  (isScalar(node) || isCollection(node)) && !!node.anchor

export abstract class NodeBase {
  readonly [NODE_TYPE]: symbol

  /** A comment on or immediately after this */
  declare comment?: string | null

  /** A comment before this */
  declare commentBefore?: string | null

  /**
   * The [start, end] range of characters of the source parsed
   * into this node (undefined for pairs or if not parsed)
   */
  declare range?: [number, number] | null

  /** A blank line before this node and its commentBefore */
  declare spaceBefore?: boolean

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
}
