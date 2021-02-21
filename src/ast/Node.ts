import type { Type } from '../constants'
import { StringifyContext } from '../stringify/stringify'
import type { PairType } from './Pair'

export declare namespace Node {
  interface Parsed extends Node {
    range: [number, number]
  }
}

export abstract class Node {
  /** A comment on or immediately after this */
  declare comment?: string | null

  /** A comment before this */
  declare commentBefore?: string | null

  /** Only available when `keepCstNodes` is set to `true` */
  // cstNode?: CST.Node

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

  /** The type of this node */
  declare type?: Type | PairType
}
