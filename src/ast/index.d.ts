import { Type } from '../constants'
import type { StringifyContext } from '../stringify/stringify'
import { Collection } from './Collection'
export { Merge } from './Merge'
import { Node } from './Node'
export { Pair, PairType } from './Pair'
import { Scalar } from './Scalar'
import { ToJSContext } from './toJS'
import { YAMLMap, findPair } from './YAMLMap'
import { YAMLSeq } from './YAMLSeq'

export { ToJSContext, toJS } from './toJS'
export { Collection, Node, Scalar, YAMLMap, YAMLSeq, findPair }

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
