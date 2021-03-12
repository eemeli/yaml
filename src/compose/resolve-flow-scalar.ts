import { Scalar } from '../nodes/Scalar.js'
import type { FlowScalar } from '../parse/tokens.js'
import { resolveEnd } from './resolve-end.js'

export function resolveFlowScalar(
  { offset, type, source, end }: FlowScalar,
  strict: boolean,
  onError: (offset: number, message: string) => void
): {
  value: string
  type: Scalar.PLAIN | Scalar.QUOTE_DOUBLE | Scalar.QUOTE_SINGLE | null
  comment: string
  length: number
} {
  let _type: Scalar.PLAIN | Scalar.QUOTE_DOUBLE | Scalar.QUOTE_SINGLE
  let value: string
  const _onError = (rel: number, msg: string) => onError(offset + rel, msg)
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
      onError(offset, `Expected a flow scalar value, but found: ${type}`)
      return {
        value: '',
        type: null,
        comment: '',
        length: source.length
      }
  }

  const re = resolveEnd(end, 0, strict, _onError)
  return {
    value,
    type: _type,
    comment: re.comment,
    length: source.length + re.offset
  }
}

function plainValue(
  source: string,
  onError: (relOffset: number, message: string) => void
) {
  switch (source[0]) {
    /* istanbul ignore next should not happen */
    case '\t':
      onError(0, 'Plain value cannot start with a tab character')
      break
    case '|':
    case '>': {
      const message = `Plain value cannot start with block scalar indicator ${source[0]}`
      onError(0, message)
      break
    }
    case '@':
    case '`': {
      const message = `Plain value cannot start with reserved character ${source[0]}`
      onError(0, message)
      break
    }
  }
  return foldLines(source.trim())
}

function singleQuotedValue(
  source: string,
  onError: (relOffset: number, message: string) => void
) {
  if (source[source.length - 1] !== "'" || source.length === 1)
    onError(source.length, "Missing closing 'quote")
  return foldLines(source.slice(1, -1)).replace(/''/g, "'")
}

function foldLines(source: string) {
  const lines = source.split(/[ \t]*\r?\n[ \t]*/)
  let res = lines[0]
  let sep = ' '
  for (let i = 1; i < lines.length - 1; ++i) {
    const line = lines[i]
    if (line === '') {
      if (sep === '\n') res += sep
      else sep = '\n'
    } else {
      res += sep + line
      sep = ' '
    }
  }
  if (lines.length > 1) res += sep + lines[lines.length - 1]
  return res
}

function doubleQuotedValue(
  source: string,
  onError: (relOffset: number, message: string) => void
) {
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
      } else if (next === 'x' || next === 'u' || next === 'U') {
        const length = { x: 2, u: 4, U: 8 }[next]
        res += parseCharCode(source, i + 1, length, onError)
        i += length
      } else {
        const raw = source.substr(i - 1, 2)
        onError(i - 1, `Invalid escape sequence ${raw}`)
        res += raw
      }
    } else if (ch === ' ' || ch === '\t') {
      // trim trailing whitespace
      const wsStart = i
      let next = source[i + 1]
      while (next === ' ' || next === '\t') next = source[++i + 1]
      if (next !== '\n') res += i > wsStart ? source.slice(wsStart, i + 1) : ch
    } else {
      res += ch
    }
  }
  if (source[source.length - 1] !== '"' || source.length === 1)
    onError(source.length, 'Missing closing "quote')
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
  onError: (offset: number, message: string) => void
) {
  const cc = source.substr(offset, length)
  const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc)
  const code = ok ? parseInt(cc, 16) : NaN
  if (isNaN(code)) {
    const raw = source.substr(offset - 2, length + 2)
    onError(offset - 2, `Invalid escape sequence ${raw}`)
    return raw
  }
  return String.fromCodePoint(code)
}
