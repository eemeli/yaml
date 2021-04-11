export {
  createScalarToken,
  resolveAsScalar,
  setScalarValue
} from './cst-scalar.js'
export { stringify } from './cst-stringify.js'
export { visit, Visitor, VisitPath } from './cst-visit.js'

export interface SourceToken {
  type:
    | 'byte-order-mark'
    | 'doc-mode'
    | 'doc-start'
    | 'space'
    | 'comment'
    | 'newline'
    | 'directive-line'
    | 'anchor'
    | 'tag'
    | 'seq-item-ind'
    | 'explicit-key-ind'
    | 'map-value-ind'
    | 'flow-map-start'
    | 'flow-map-end'
    | 'flow-seq-start'
    | 'flow-seq-end'
    | 'flow-error-end'
    | 'comma'
    | 'block-scalar-header'
  offset: number
  indent: number
  source: string
}

export interface ErrorToken {
  type: 'error'
  offset: number
  source: string
  message: string
}

export interface Directive {
  type: 'directive'
  offset: number
  source: string
}

export interface Document {
  type: 'document'
  offset: number
  start: SourceToken[]
  value?: Token
  end?: SourceToken[]
}

export interface DocumentEnd {
  type: 'doc-end'
  offset: number
  source: string
  end?: SourceToken[]
}

export interface FlowScalar {
  type: 'alias' | 'scalar' | 'single-quoted-scalar' | 'double-quoted-scalar'
  offset: number
  indent: number
  source: string
  end?: SourceToken[]
}

export interface BlockScalar {
  type: 'block-scalar'
  offset: number
  indent: number
  props: Token[]
  source: string
}

export interface BlockMap {
  type: 'block-map'
  offset: number
  indent: number
  items: Array<
    | { start: SourceToken[]; key?: never; sep?: never; value?: never }
    | {
        start: SourceToken[]
        key: Token | null
        sep: SourceToken[]
        value?: Token
      }
  >
}

export interface BlockSequence {
  type: 'block-seq'
  offset: number
  indent: number
  items: Array<{
    start: SourceToken[]
    key?: never
    sep?: never
    value?: Token
  }>
}

export type CollectionItem = {
  start: SourceToken[]
  key?: Token | null
  sep?: SourceToken[]
  value?: Token
}

export interface FlowCollection {
  type: 'flow-collection'
  offset: number
  indent: number
  start: SourceToken
  items: CollectionItem[]
  end: SourceToken[]
}

export type Token =
  | SourceToken
  | ErrorToken
  | Directive
  | Document
  | DocumentEnd
  | FlowScalar
  | BlockScalar
  | BlockMap
  | BlockSequence
  | FlowCollection

export type TokenType =
  | SourceToken['type']
  | DocumentEnd['type']
  | FlowScalar['type']

/** The byte order mark */
export const BOM = '\u{FEFF}'

/** Start of doc-mode */
export const DOCUMENT = '\x02' // C0: Start of Text

/** Unexpected end of flow-mode */
export const FLOW_END = '\x18' // C0: Cancel

/** Next token is a scalar value */
export const SCALAR = '\x1f' // C0: Unit Separator

/** @returns `true` if `token` is a flow or block collection */
export const isCollection = (
  token: Token | null | undefined
): token is BlockMap | BlockSequence | FlowCollection =>
  !!token && 'items' in token

/** @returns `true` if `token` is a flow or block scalar; not an alias */
export const isScalar = (
  token: Token | null | undefined
): token is FlowScalar | BlockScalar =>
  !!token &&
  (token.type === 'scalar' ||
    token.type === 'single-quoted-scalar' ||
    token.type === 'double-quoted-scalar' ||
    token.type === 'block-scalar')

/* istanbul ignore next */
/** Get a printable representation of a lexer token */
export function prettyToken(token: string) {
  switch (token) {
    case BOM:
      return '<BOM>'
    case DOCUMENT:
      return '<DOC>'
    case FLOW_END:
      return '<FLOW_END>'
    case SCALAR:
      return '<SCALAR>'
    default:
      return JSON.stringify(token)
  }
}

/** Identify the type of a lexer token. May return `null` for unknown tokens. */
export function tokenType(source: string): TokenType | null {
  switch (source) {
    case BOM:
      return 'byte-order-mark'
    case DOCUMENT:
      return 'doc-mode'
    case FLOW_END:
      return 'flow-error-end'
    case SCALAR:
      return 'scalar'
    case '---':
      return 'doc-start'
    case '...':
      return 'doc-end'
    case '':
    case '\n':
    case '\r\n':
      return 'newline'
    case '-':
      return 'seq-item-ind'
    case '?':
      return 'explicit-key-ind'
    case ':':
      return 'map-value-ind'
    case '{':
      return 'flow-map-start'
    case '}':
      return 'flow-map-end'
    case '[':
      return 'flow-seq-start'
    case ']':
      return 'flow-seq-end'
    case ',':
      return 'comma'
  }
  switch (source[0]) {
    case ' ':
    case '\t':
      return 'space'
    case '#':
      return 'comment'
    case '%':
      return 'directive-line'
    case '*':
      return 'alias'
    case '&':
      return 'anchor'
    case '!':
      return 'tag'
    case "'":
      return 'single-quoted-scalar'
    case '"':
      return 'double-quoted-scalar'
    case '|':
    case '>':
      return 'block-scalar-header'
  }
  return null
}
