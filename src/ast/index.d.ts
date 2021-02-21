import { Type } from '../constants'
import type { StringifyContext } from '../stringify/stringify'
import { Collection } from './Collection'
import { Node } from './Node'
import { Scalar } from './Scalar'
import { ToJSContext } from './toJS'

export { ToJSContext, toJS } from './toJS'

export { Collection, Node, Scalar }

export function findPair(items: any[], key: Scalar | any): Pair | undefined

export class Alias extends Node {
  constructor(source: Node)
  type: Type.ALIAS
  source: Node
  // cstNode?: CST.Alias
  toJSON(arg?: any, ctx?: ToJSContext): any
  toString(ctx: StringifyContext): string
}

export namespace Alias {
  interface Parsed extends Alias {
    range: [number, number]
  }
}

export class Pair extends Node {
  constructor(key: any, value?: any)
  type: Pair.Type.PAIR | Pair.Type.MERGE_PAIR
  /** Always Node or null when parsed, but can be set to anything. */
  key: any
  /** Always Node or null when parsed, but can be set to anything. */
  value: any
  cstNode?: never // no corresponding cstNode
  toJSON(arg?: any, ctx?: ToJSContext): object | Map<any, any>
  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}
export namespace Pair {
  enum Type {
    PAIR = 'PAIR',
    MERGE_PAIR = 'MERGE_PAIR'
  }
}

export class Merge extends Pair {
  static KEY: '<<'
  constructor(pair?: Pair)
  type: Pair.Type.MERGE_PAIR
  /** Always Scalar('<<'), defined by the type specification */
  key: AST.PlainValue
  /** Always YAMLSeq<Alias(Map)>, stringified as *A if length = 1 */
  value: YAMLSeq
  toString(ctx?: StringifyContext, onComment?: () => void): string
}

export class YAMLMap extends Collection {
  static readonly tagName: 'tag:yaml.org,2002:map'
  type?: Type.FLOW_MAP | Type.MAP
  items: Array<Pair>
  add(value: unknown): void
  delete(key: unknown): boolean
  get(key: unknown, keepScalar?: boolean): unknown
  has(key: unknown): boolean
  set(key: unknown, value: unknown): void
  toJSON(arg?: any, ctx?: ToJSContext): object | Map<any, any>
  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}

export namespace YAMLMap {
  interface Parsed extends YAMLMap {
    range: [number, number]
  }
}

export class YAMLSeq extends Collection {
  static readonly tagName: 'tag:yaml.org,2002:seq'
  type?: Type.FLOW_SEQ | Type.SEQ
  add(value: unknown): void
  delete(key: number | string | Scalar): boolean
  get(key: number | string | Scalar, keepScalar?: boolean): any
  has(key: number | string | Scalar): boolean
  set(key: number | string | Scalar, value: any): void
  toJSON(arg?: any, ctx?: ToJSContext): any[]
  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string
}

export namespace YAMLSeq {
  interface Parsed extends YAMLSeq {
    items: Node[]
    range: [number, number]
  }
}

export namespace AST {
  interface BlockFolded extends Scalar {
    type: Type.BLOCK_FOLDED
    // cstNode?: CST.BlockFolded
  }

  interface BlockLiteral extends Scalar {
    type: Type.BLOCK_LITERAL
    // cstNode?: CST.BlockLiteral
  }

  interface PlainValue extends Scalar {
    type: Type.PLAIN
    // cstNode?: CST.PlainValue
  }

  interface QuoteDouble extends Scalar {
    type: Type.QUOTE_DOUBLE
    // cstNode?: CST.QuoteDouble
  }

  interface QuoteSingle extends Scalar {
    type: Type.QUOTE_SINGLE
    // cstNode?: CST.QuoteSingle
  }

  interface FlowMap extends YAMLMap {
    type: Type.FLOW_MAP
    // cstNode?: CST.FlowMap
  }

  interface BlockMap extends YAMLMap {
    type: Type.MAP
    // cstNode?: CST.Map
  }

  interface FlowSeq extends YAMLSeq {
    type: Type.FLOW_SEQ
    items: Array<Node>
    // cstNode?: CST.FlowSeq
  }

  interface BlockSeq extends YAMLSeq {
    type: Type.SEQ
    items: Array<Node | null>
    // cstNode?: CST.Seq
  }
}
