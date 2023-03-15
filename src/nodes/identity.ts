import type { Document } from '../doc/Document.js'
import type { Alias } from './Alias.js'
import type { Node } from './Node.js'
import type { Pair } from './Pair.js'
import type { Scalar } from './Scalar.js'
import type { YAMLMap } from './YAMLMap.js'
import type { YAMLSeq } from './YAMLSeq.js'

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
