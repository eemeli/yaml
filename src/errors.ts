import type { LineCounter } from './parse/line-counter'

export type ErrorCode =
  | 'ALIAS_PROPS'
  | 'BAD_DIRECTIVE'
  | 'BAD_DQ_ESCAPE'
  | 'BAD_INDENT'
  | 'BAD_SCALAR_START'
  | 'BLOCK_AS_IMPLICIT_KEY'
  | 'BLOCK_IN_FLOW'
  | 'COMMENT_SPACE'
  | 'IMPOSSIBLE'
  | 'KEY_OVER_1024_CHARS'
  | 'MISSING_ANCHOR'
  | 'MISSING_CHAR'
  | 'MULTILINE_IMPLICIT_KEY'
  | 'MULTIPLE_ANCHORS'
  | 'MULTIPLE_DOCS'
  | 'MULTIPLE_TAGS'
  | 'PROP_BEFORE_SEP'
  | 'TAB_AS_INDENT'
  | 'TAG_RESOLVE_FAILED'
  | 'UNEXPECTED_TOKEN'

export class YAMLError extends Error {
  name: 'YAMLParseError' | 'YAMLWarning'
  code: ErrorCode
  message: string
  offset: number
  linePos?: { line: number; col: number }

  constructor(
    name: YAMLError['name'],
    offset: number,
    code: ErrorCode,
    message: string
  ) {
    super()
    this.name = name
    this.code = code
    this.message = message
    this.offset = offset
  }
}

export class YAMLParseError extends YAMLError {
  constructor(offset: number, code: ErrorCode, message: string) {
    super('YAMLParseError', offset, code, message)
  }
}

export class YAMLWarning extends YAMLError {
  constructor(offset: number, code: ErrorCode, message: string) {
    super('YAMLWarning', offset, code, message)
  }
}

export const prettifyError = (src: string, lc: LineCounter) => (
  error: YAMLError
) => {
  if (error.offset === -1) return
  error.linePos = lc.linePos(error.offset)
  const { line, col } = error.linePos
  error.message += ` at line ${line}, column ${col}`

  let ci = col - 1
  let lineStr = src
    .substring(lc.lineStarts[line - 1], lc.lineStarts[line])
    .replace(/[\n\r]+$/, '')

  // Trim to max 80 chars, keeping col position near the middle
  if (ci >= 60 && lineStr.length > 80) {
    const trimStart = Math.min(ci - 39, lineStr.length - 79)
    lineStr = '…' + lineStr.substring(trimStart)
    ci -= trimStart - 1
  }
  if (lineStr.length > 80) lineStr = lineStr.substring(0, 79) + '…'

  // Include previous line in context if pointing at line start
  if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
    // Regexp won't match if start is trimmed
    let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1])
    if (prev.length > 80) prev = prev.substring(0, 79) + '…\n'
    lineStr = prev + lineStr
  }

  if (/[^ ]/.test(lineStr)) {
    const pointer = ' '.repeat(ci) + '^'
    error.message += `:\n\n${lineStr}\n${pointer}\n`
  }
}
