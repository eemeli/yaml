import { Type } from '../constants.js'
import type { BlockScalar } from '../parse/tokens.js'

export function resolveBlockScalar(
  scalar: BlockScalar,
  strict: boolean,
  onError: (offset: number, message: string) => void
): {
  value: string
  type: Type.BLOCK_FOLDED | Type.BLOCK_LITERAL | null
  comment: string
  length: number
} {
  const header = parseBlockScalarHeader(scalar, strict, onError)
  if (!header) return { value: '', type: null, comment: '', length: 0 }
  const type = header.mode === '>' ? Type.BLOCK_FOLDED : Type.BLOCK_LITERAL
  const lines = scalar.source ? splitLines(scalar.source) : []

  // determine the end of content & start of chomping
  let chompStart = lines.length
  for (let i = lines.length - 1; i >= 0; --i)
    if (lines[i][1] === '') chompStart = i
    else break

  // shortcut for empty contents
  if (!scalar.source || chompStart === 0) {
    const value =
      header.chomp === '+' ? lines.map(line => line[0]).join('\n') : ''
    let length = header.length
    if (scalar.source) length += scalar.source.length
    return { value, type, comment: header.comment, length }
  }

  // find the indentation level to trim from start
  let trimIndent = scalar.indent + header.indent
  let offset = scalar.offset + header.length
  let contentStart = 0
  for (let i = 0; i < chompStart; ++i) {
    const [indent, content] = lines[i]
    if (content === '') {
      if (header.indent === 0 && indent.length > trimIndent)
        trimIndent = indent.length
    } else {
      if (indent.length < trimIndent) {
        const message =
          'Block scalars with more-indented leading empty lines must use an explicit indentation indicator'
        onError(offset + indent.length, message)
      }
      if (header.indent === 0) trimIndent = indent.length
      contentStart = i
      break
    }
    offset += indent.length + content.length + 1
  }

  let value = ''
  let sep = ''
  let prevMoreIndented = false

  // leading whitespace is kept intact
  for (let i = 0; i < contentStart; ++i)
    value += lines[i][0].slice(trimIndent) + '\n'

  for (let i = contentStart; i < chompStart; ++i) {
    let [indent, content] = lines[i]
    offset += indent.length + content.length + 1
    const crlf = content[content.length - 1] === '\r'
    if (crlf) content = content.slice(0, -1)

    if (content && indent.length < trimIndent) {
      const src = header.indent
        ? 'explicit indentation indicator'
        : 'first line'
      const message = `Block scalar lines must not be less indented than their ${src}`
      onError(offset - content.length - (crlf ? 2 : 1), message)
      indent = ''
    }

    if (type === Type.BLOCK_LITERAL) {
      value += sep + indent.slice(trimIndent) + content
      sep = '\n'
    } else if (indent.length > trimIndent || content[0] === '\t') {
      // more-indented content within a folded block
      if (sep === ' ') sep = '\n'
      else if (!prevMoreIndented && sep === '\n') sep = '\n\n'
      value += sep + indent.slice(trimIndent) + content
      sep = '\n'
      prevMoreIndented = true
    } else if (content === '') {
      // empty line
      if (sep === '\n') value += '\n'
      else sep = '\n'
    } else {
      value += sep + content
      sep = ' '
      prevMoreIndented = false
    }
  }

  switch (header.chomp) {
    case '-':
      break
    case '+':
      for (let i = chompStart; i < lines.length; ++i)
        value += '\n' + lines[i][0].slice(trimIndent)
      if (value[value.length - 1] !== '\n') value += '\n'
      break
    default:
      value += '\n'
  }

  return {
    value,
    type,
    comment: header.comment,
    length: header.length + scalar.source.length
  }
}

function parseBlockScalarHeader(
  { offset, props }: BlockScalar,
  strict: boolean,
  onError: (offset: number, message: string) => void
) {
  if (props[0].type !== 'block-scalar-header') {
    onError(offset, 'Block scalar header not found')
    return null
  }
  const { source } = props[0]
  const mode = source[0] as '>' | '|'
  let indent = 0
  let chomp: '' | '-' | '+' = ''
  let error = -1
  for (let i = 1; i < source.length; ++i) {
    const ch = source[i]
    if (!chomp && (ch === '-' || ch === '+')) chomp = ch
    else {
      const n = Number(ch)
      if (!indent && n) indent = n
      else if (error === -1) error = offset + i
    }
  }
  if (error !== -1)
    onError(error, `Block scalar header includes extra characters: ${source}`)
  let hasSpace = false
  let comment = ''
  let length = source.length
  for (let i = 1; i < props.length; ++i) {
    const token = props[i]
    switch (token.type) {
      case 'space':
        hasSpace = true
      // fallthrough
      case 'newline':
        length += token.source.length
        break
      case 'comment':
        if (strict && !hasSpace) {
          const message =
            'Comments must be separated from other tokens by white space characters'
          onError(offset + length, message)
        }
        length += token.source.length
        comment = token.source.substring(1)
        break
      case 'error':
        onError(offset + length, token.message)
        length += token.source.length
        break
      default: {
        const message = `Unexpected token in block scalar header: ${token.type}`
        onError(offset + length, message)
        const ts = (token as any).source
        if (ts && typeof ts === 'string') length += ts.length
      }
    }
  }
  return { mode, indent, chomp, comment, length }
}

/** @returns Array of lines split up as `[indent, content]` */
function splitLines(source: string) {
  const split = source.split(/\n( *)/)
  const first = split[0]
  const m = first.match(/^( *)/)
  const line0: [string, string] =
    m && m[1] ? [m[1], first.slice(m[1].length)] : ['', first]
  const lines = [line0]
  for (let i = 1; i < split.length; i += 2) lines.push([split[i], split[i + 1]])
  return lines
}
