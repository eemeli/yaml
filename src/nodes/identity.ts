import type { Document } from '../doc/Document.ts'
import type { Alias } from './Alias.ts'
import type { Node } from './Node.ts'
import type { Pair } from './Pair.ts'
import type { Scalar } from './Scalar.ts'
import type { YAMLMap } from './YAMLMap.ts'
import type { YAMLSeq } from './YAMLSeq.ts'

export const ALIAS: unique symbol = Symbol.for('yaml.alias')
export const DOC: unique symbol = Symbol.for('yaml.document')
export const MAP: unique symbol = Symbol.for('yaml.map')
export const PAIR: unique symbol = Symbol.for('yaml.pair')
export const SCALAR: unique symbol = Symbol.for('yaml.scalar')
export const SEQ: unique symbol = Symbol.for('yaml.seq')
export const NODE_TYPE: unique symbol = Symbol.for('yaml.node.type')

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
