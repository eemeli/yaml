import type { ErrorCode } from '../errors.ts'
import type { Range } from '../nodes/types.ts'
import { Scalar } from '../nodes/Scalar.ts'
import type { FlowScalar } from '../parse/cst.ts'
import type { ComposeErrorHandler } from './composer.ts'
import { resolveEnd } from './resolve-end.ts'

type FlowScalarErrorHandler = (
  offset: number,
  code: ErrorCode,
  message: string
) => void

export function resolveFlowScalar(
  scalar: FlowScalar,
  strict: boolean,
  onError: ComposeErrorHandler
): {
  value: string
  type: Scalar.PLAIN | Scalar.QUOTE_DOUBLE | Scalar.QUOTE_SINGLE | null
  comment: string
  range: Range
} {
  const { offset, type, source, end } = scalar
  let _type: Scalar.PLAIN | Scalar.QUOTE_DOUBLE | Scalar.QUOTE_SINGLE
  let value: string
  const _onError: FlowScalarErrorHandler = (rel, code, msg) =>
    onError(offset + rel, code, msg)
  switch (type) {
    case 'scalar':
      _type = Scalar.PLAIN
      value = plainValue(source, _onError)
      break

    case 'single-quoted-scalar':
      _type = Scalar.QUOTE_SINGLE
      value = singleQuotedValue(source, _onError)
      break

    case 'double-quoted-scalar':
      _type = Scalar.QUOTE_DOUBLE
      value = doubleQuotedValue(source, _onError)
      break

    /* istanbul ignore next should not happen */
    default:
      onError(
        scalar,
        'UNEXPECTED_TOKEN',
        `Expected a flow scalar value, but found: ${type}`
      )
      return {
        value: '',
        type: null,
        comment: '',
        range: [offset, offset + source.length, offset + source.length]
      }
  }

  const valueEnd = offset + source.length
  const re = resolveEnd(end, valueEnd, strict, onError)
  return {
    value,
    type: _type,
    comment: re.comment,
    range: [offset, valueEnd, re.offset]
  }
}

function plainValue(source: string, onError: FlowScalarErrorHandler) {
  let badChar = ''
  switch (source[0]) {
    /* istanbul ignore next should not happen */
    case '\t':
      badChar = 'a tab character'
      break
    case ',':
      badChar = 'flow indicator character ,'
      break
    case '%':
      badChar = 'directive indicator character %'
      break
    case '|':
    case '>': {
      badChar = `block scalar indicator ${source[0]}`
      break
    }
    case '@':
    case '`': {
      badChar = `reserved character ${source[0]}`
      break
    }
  }
  if (badChar)
    onError(0, 'BAD_SCALAR_START', `Plain value cannot start with ${badChar}`)
  return foldLines(source)
}

function singleQuotedValue(source: string, onError: FlowScalarErrorHandler) {
  if (source[source.length - 1] !== "'" || source.length === 1)
    onError(source.length, 'MISSING_CHAR', "Missing closing 'quote")
  return foldLines(source.slice(1, -1)).replace(/''/g, "'")
}

const CHAR_CR = 0x0d
const CHAR_SPACE = 0x20
const CHAR_TAB = 0x09

function foldLines(source: string) {
  let newLineIndex = source.indexOf('\n')
  if (newLineIndex === -1) return source

  // This finds the index in the first line of the last non-space/non-tab char
  let end = newLineIndex
  let cc = source.charCodeAt(end - 1)
  if (cc === CHAR_CR) cc = source.charCodeAt(--end - 1)
  while (end > 0 && (cc === CHAR_SPACE || cc === CHAR_TAB))
    cc = source.charCodeAt(--end - 1)
  let res = source.slice(0, end)

  let sep = ' '
  let pos = newLineIndex + 1

  // now we go through each line, find the first non-space/tab char.
  // then find the last non-space/tab char.
  // the slice between those is added to the result with a separator
  while ((newLineIndex = source.indexOf('\n', pos)) !== -1) {
    let start = pos
    cc = source.charCodeAt(start)
    while (start < newLineIndex && (cc === CHAR_SPACE || cc === CHAR_TAB))
      cc = source.charCodeAt(++start)
    end = newLineIndex
    cc = source.charCodeAt(end - 1)
    if (cc === CHAR_CR) cc = source.charCodeAt(--end - 1)
    while (end > start && (cc === CHAR_SPACE || cc === CHAR_TAB))
      cc = source.charCodeAt(--end - 1)

    if (start === end) {
      if (sep === '\n') res += sep
      else sep = '\n'
    } else {
      res += sep + source.slice(start, end)
      sep = ' '
    }
    pos = newLineIndex + 1
  }

  // finally we find the first non-space/tab char in the last line and
  // add the rest to the result
  let start = pos
  cc = source.charCodeAt(start)
  while (start < source.length && (cc === CHAR_SPACE || cc === CHAR_TAB))
    cc = source.charCodeAt(++start)
  return res + sep + source.slice(start)
}

function doubleQuotedValue(source: string, onError: FlowScalarErrorHandler) {
  let res = ''
  for (let i = 1; i < source.length - 1; ++i) {
    const ch = source[i]
    if (ch === '\r' && source[i + 1] === '\n') continue
    if (ch === '\n') {
      const { fold, offset } = foldNewline(source, i)
      res += fold
      i = offset
    } else if (ch === '\\') {
      let next = source[++i]
      const cc = escapeCodes[next]
      if (cc) res += cc
      else if (next === '\n') {
        // skip escaped newlines, but still trim the following line
        next = source[i + 1]
        while (next === ' ' || next === '\t') next = source[++i + 1]
      } else if (next === '\r' && source[i + 1] === '\n') {
        // skip escaped CRLF newlines, but still trim the following line
        next = source[++i + 1]
        while (next === ' ' || next === '\t') next = source[++i + 1]
      } else if (next === 'x' || next === 'u' || next === 'U') {
        const length = next === 'x' ? 2 : next === 'u' ? 4 : 8
        res += parseCharCode(source, i + 1, length, onError)
        i += length
      } else {
        const raw = source.substr(i - 1, 2)
        onError(i - 1, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`)
        res += raw
      }
    } else if (ch === ' ' || ch === '\t') {
      // trim trailing whitespace
      const wsStart = i
      let next = source[i + 1]
      while (next === ' ' || next === '\t') next = source[++i + 1]
      if (next !== '\n' && !(next === '\r' && source[i + 2] === '\n'))
        res += i > wsStart ? source.slice(wsStart, i + 1) : ch
    } else {
      res += ch
    }
  }
  if (source[source.length - 1] !== '"' || source.length === 1)
    onError(source.length, 'MISSING_CHAR', 'Missing closing "quote')
  return res
}

/**
 * Fold a single newline into a space, multiple newlines to N - 1 newlines.
 * Presumes `source[offset] === '\n'`
 */
function foldNewline(source: string, offset: number) {
  let fold = ''
  let ch = source[offset + 1]
  while (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
    if (ch === '\r' && source[offset + 2] !== '\n') break
    if (ch === '\n') fold += '\n'
    offset += 1
    ch = source[offset + 1]
  }
  if (!fold) fold = ' '
  return { fold, offset }
}

const escapeCodes: Record<string, string> = {
  '0': '\0', // null character
  a: '\x07', // bell character
  b: '\b', // backspace
  e: '\x1b', // escape character
  f: '\f', // form feed
  n: '\n', // line feed
  r: '\r', // carriage return
  t: '\t', // horizontal tab
  v: '\v', // vertical tab
  N: '\u0085', // Unicode next line
  _: '\u00a0', // Unicode non-breaking space
  L: '\u2028', // Unicode line separator
  P: '\u2029', // Unicode paragraph separator
  ' ': ' ',
  '"': '"',
  '/': '/',
  '\\': '\\',
  '\t': '\t'
}

function parseCharCode(
  source: string,
  offset: number,
  length: number,
  onError: FlowScalarErrorHandler
) {
  const cc = source.substr(offset, length)
  const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc)
  const code = ok ? parseInt(cc, 16) : NaN
  try {
    return String.fromCodePoint(code)
  } catch {
    const raw = source.substr(offset - 2, length + 2)
    onError(offset - 2, 'BAD_DQ_ESCAPE', `Invalid escape sequence ${raw}`)
    return raw
  }
}
