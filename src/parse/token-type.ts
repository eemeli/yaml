export const DOCUMENT = '\x02' // Start of Text
export const FLOW_END = '\x18' // Cancel
export const SCALAR = '\x1f' // Unit Separator

export type SourceTokenType =
  | 'doc-mode'
  | 'scalar'
  | 'doc-start'
  | 'doc-end'
  | 'space'
  | 'comment'
  | 'newline'
  | 'directive-line'
  | 'alias'
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
  | 'single-quoted-scalar'
  | 'double-quoted-scalar'
  | 'block-scalar-header'

export function prettyToken(token: string) {
  if (token === DOCUMENT) return '<DOC>'
  if (token === FLOW_END) return '<FLOW_END>'
  if (token === SCALAR) return '<SCALAR>'
  return JSON.stringify(token)
}

export function tokenType(source: string): SourceTokenType | null {
  switch (source) {
    case DOCUMENT: // start of doc-mode
      return 'doc-mode'
    case FLOW_END: // unexpected end of flow mode
      return 'flow-error-end'
    case SCALAR: // next token is a scalar value
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
