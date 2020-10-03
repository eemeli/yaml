import { Type } from '../constants.js'
import { BlockScalar, Token } from './parser.js'

export function blockScalarValue(
  scalar: BlockScalar,
  onError: (offset: number, message: string) => void,
  onType: (type: Type.BLOCK_LITERAL | Type.BLOCK_FOLDED) => void
) {
  const header = parseBlockScalarHeader(scalar.props, onError)
  if (!header || !scalar.source) return ''
  const lines = splitLines(scalar.source)

  // determine the end of content & start of chomping
  let chompStart = lines.length
  for (let i = lines.length - 1; i >= 0; --i)
    if (lines[i][1] === '') chompStart = i
    else break

  // shortcut for empty contents
  if (chompStart === 0) {
    if (header.chomp === '+')
      return lines.map(line => line[0]).join('\n') + '\n'
    else return header.chomp === '-' ? '' : '\n'
  }

  // find the indentation level to trim from start
  let trimIndent = scalar.indent + header.indent
  let offset = header.length
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
      trimIndent = indent.length
      contentStart = i
      break
    }
    offset += indent.length + content.length + 1
  }

  let res = ''
  let sep = ''
  let prevMoreIndented = false

  // leading whitespace is kept intact
  for (let i = 0; i < contentStart; ++i)
    res += lines[i][0].slice(trimIndent) + '\n'

  const folded = header.mode === '>'
  onType(folded ? Type.BLOCK_FOLDED : Type.BLOCK_LITERAL)
  for (let i = contentStart; i < chompStart; ++i) {
    let [indent, content] = lines[i]
    offset += indent.length + content.length + 1
    const crlf = content[content.length - 1] === '\r'
    if (crlf) content = content.slice(0, -1)

    if (indent.length < trimIndent) {
      if (content === '') {
        // empty line
        if (sep === '\n') res += '\n'
        else sep = '\n'
        continue
      } else {
        const src = header.indent
          ? 'explicit indentation indicator'
          : 'first line'
        const message = `Block scalar lines must not be less indented than their ${src}`
        onError(offset - content.length - (crlf ? 2 : 1), message)
        indent = ''
      }
    }

    if (folded) {
      if (!indent || indent.length === trimIndent) {
        res += sep + content
        sep = ' '
        prevMoreIndented = false
      } else {
        // more-indented content within a folded block
        if (sep === ' ') sep = '\n'
        else if (!prevMoreIndented && sep === '\n') sep = '\n\n'
        res += sep + indent.slice(trimIndent) + content
        sep = '\n'
        prevMoreIndented = true
      }
    } else {
      // literal
      res += sep + indent.slice(trimIndent) + content
      sep = '\n'
    }
  }

  switch (header.chomp) {
    case '-':
      return res
    case '+':
      for (let i = chompStart; i < lines.length; ++i)
        res += '\n' + lines[i][0].slice(trimIndent)
      return res[res.length - 1] === '\n' ? res : res + '\n'
    default:
      return res + '\n'
  }
}

function parseBlockScalarHeader(
  props: Token[],
  onError: (offset: number, message: string) => void
) {
  if (props[0].type !== 'block-scalar-header') {
    onError(0, 'Block scalar header not found')
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
      else if (error === -1) error = i
    }
  }
  if (error !== -1)
    onError(error, `Block scalar header includes extra characters: ${source}`)
  let length = source.length
  for (let i = 1; i < props.length; ++i) {
    const token = props[i]
    switch (token.type) {
      case 'space':
      case 'comment':
      case 'newline':
        length += token.source.length
        break
      default: {
        const message = `Unexpected token in block scalar header: ${token.type}`
        onError(length, message)
        const ts = (token as any).source || ''
        if (typeof ts === 'string') length += ts.length
      }
    }
  }
  return { mode, indent, chomp, length }
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
