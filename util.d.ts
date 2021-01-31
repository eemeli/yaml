import { Document } from '.'
import { CST } from './cst'
import { Node, Pair, Scalar, Schema, YAMLMap, YAMLSeq } from './types'

export function findPair(items: any[], key: Scalar | any): Pair | undefined

export function stringifyNumber(item: Scalar): string
export function stringifyString(
  item: Scalar,
  ctx: Schema.StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string

export function toJS(value: any, arg?: any, ctx?: Schema.CreateNodeContext): any

/**
 * Apply a visitor to an AST node or document.
 *
 * Walks through the tree (depth-first) starting from `node`, calling each of
 * the visitor functions (if defined) according to the current node type.
 */
export function visit(
  node: Node | Document,
  visitor:
    | ((node: any) => void)
    | {
        Document?: (doc: Document) => void
        Map?: (map: YAMLMap) => void
        Pair?: (pair: Pair) => void
        Seq?: (seq: YAMLSeq) => void
        Scalar?: (scalar: Scalar) => void
      }
): void

export enum Type {
  ALIAS = 'ALIAS',
  BLANK_LINE = 'BLANK_LINE',
  BLOCK_FOLDED = 'BLOCK_FOLDED',
  BLOCK_LITERAL = 'BLOCK_LITERAL',
  COMMENT = 'COMMENT',
  DIRECTIVE = 'DIRECTIVE',
  DOCUMENT = 'DOCUMENT',
  FLOW_MAP = 'FLOW_MAP',
  FLOW_SEQ = 'FLOW_SEQ',
  MAP = 'MAP',
  MAP_KEY = 'MAP_KEY',
  MAP_VALUE = 'MAP_VALUE',
  PLAIN = 'PLAIN',
  QUOTE_DOUBLE = 'QUOTE_DOUBLE',
  QUOTE_SINGLE = 'QUOTE_SINGLE',
  SEQ = 'SEQ',
  SEQ_ITEM = 'SEQ_ITEM'
}

interface LinePos {
  line: number
  col: number
}

export class YAMLError extends Error {
  name:
    | 'YAMLReferenceError'
    | 'YAMLSemanticError'
    | 'YAMLSyntaxError'
    | 'YAMLWarning'
  message: string
  source?: CST.Node

  nodeType?: Type
  range?: CST.Range
  linePos?: { start: LinePos; end: LinePos }

  /**
   * Drops `source` and adds `nodeType`, `range` and `linePos`, as well as
   * adding details to `message`. Run automatically for document errors if
   * the `prettyErrors` option is set.
   */
  makePretty(): void
}

export class YAMLReferenceError extends YAMLError {
  name: 'YAMLReferenceError'
}

export class YAMLSemanticError extends YAMLError {
  name: 'YAMLSemanticError'
}

export class YAMLSyntaxError extends YAMLError {
  name: 'YAMLSyntaxError'
}

export class YAMLWarning extends YAMLError {
  name: 'YAMLWarning'
}
