import { Type } from '../constants.js'
import type { Scalar } from '../nodes/Scalar.js'
import { addCommentBefore } from './addComment.js'
import {
  foldFlowLines,
  FoldOptions,
  FOLD_BLOCK,
  FOLD_FLOW,
  FOLD_QUOTED
} from './foldFlowLines.js'
import type { StringifyContext } from './stringify.js'

interface StringifyScalar extends Scalar {
  value: string
}

const getFoldOptions = (ctx: StringifyContext): FoldOptions => ({
  indentAtStart: ctx.indentAtStart,
  lineWidth: ctx.options.lineWidth,
  minContentWidth: ctx.options.minContentWidth
})

// Also checks for lines starting with %, as parsing the output as YAML 1.1 will
// presume that's starting a new document.
const containsDocumentMarker = (str: string) => /^(%|---|\.\.\.)/m.test(str)

function lineLengthOverLimit(str: string, lineWidth: number, indentLength: number) {
  if (!lineWidth || lineWidth < 0) return false
  const limit = lineWidth - indentLength
  const strLen = str.length
  if (strLen <= limit) return false
  for (let i = 0, start = 0; i < strLen; ++i) {
    if (str[i] === '\n') {
      if (i - start > limit) return true
      start = i + 1
      if (strLen - start <= limit) return false
    }
  }
  return true
}

function doubleQuotedString(value: string, ctx: StringifyContext) {
  const json = JSON.stringify(value)
  if (ctx.options.doubleQuotedAsJSON) return json

  const { implicitKey } = ctx
  const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength
  const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '')
  let str = ''
  let start = 0
  for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
    if (ch === ' ' && json[i + 1] === '\\' && json[i + 2] === 'n') {
      // space before newline needs to be escaped to not be folded
      str += json.slice(start, i) + '\\ '
      i += 1
      start = i
      ch = '\\'
    }
    if (ch === '\\')
      switch (json[i + 1]) {
        case 'u':
          {
            str += json.slice(start, i)
            const code = json.substr(i + 2, 4)
            switch (code) {
              case '0000':
                str += '\\0'
                break
              case '0007':
                str += '\\a'
                break
              case '000b':
                str += '\\v'
                break
              case '001b':
                str += '\\e'
                break
              case '0085':
                str += '\\N'
                break
              case '00a0':
                str += '\\_'
                break
              case '2028':
                str += '\\L'
                break
              case '2029':
                str += '\\P'
                break
              default:
                if (code.substr(0, 2) === '00') str += '\\x' + code.substr(2)
                else str += json.substr(i, 6)
            }
            i += 5
            start = i + 1
          }
          break
        case 'n':
          if (
            implicitKey ||
            json[i + 2] === '"' ||
            json.length < minMultiLineLength
          ) {
            i += 1
          } else {
            // folding will eat first newline
            str += json.slice(start, i) + '\n\n'
            while (
              json[i + 2] === '\\' &&
              json[i + 3] === 'n' &&
              json[i + 4] !== '"'
            ) {
              str += '\n'
              i += 2
            }
            str += indent
            // space after newline needs to be escaped to not be folded
            if (json[i + 2] === ' ') str += '\\'
            i += 1
            start = i + 1
          }
          break
        default:
          i += 1
      }
  }
  str = start ? str + json.slice(start) : json
  return implicitKey
    ? str
    : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx))
}

function singleQuotedString(value: string, ctx: StringifyContext) {
  if (ctx.implicitKey) {
    if (/\n/.test(value)) return doubleQuotedString(value, ctx)
  } else {
    // single quoted string can't have leading or trailing whitespace around newline
    if (/[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, ctx)
  }
  const indent = ctx.indent || (containsDocumentMarker(value) ? '  ' : '')
  const res =
    "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`) + "'"
  return ctx.implicitKey
    ? res
    : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx))
}

function blockString(
  { comment, type, value }: StringifyScalar,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
) {
  // 1. Block can't end in whitespace unless the last line is non-empty.
  // 2. Strings consisting of only whitespace are best rendered explicitly.
  if (/\n[\t ]+$/.test(value) || /^\s*$/.test(value)) {
    return doubleQuotedString(value, ctx)
  }
  const indent =
    ctx.indent ||
    (ctx.forceBlockIndent || containsDocumentMarker(value) ? '  ' : '')
  const indentSize = indent ? '2' : '1' // root is at -1
  const literal =
    type === Type.BLOCK_FOLDED
      ? false
      : type === Type.BLOCK_LITERAL
      ? true
      : !lineLengthOverLimit(value, ctx.options.lineWidth, indent.length)
  let header = literal ? '|' : '>'
  if (!value) return header + '\n'
  let wsStart = ''
  let wsEnd = ''
  value = value
    .replace(/[\n\t ]*$/, ws => {
      const n = ws.indexOf('\n')
      if (n === -1) {
        header += '-' // strip
      } else if (value === ws || n !== ws.length - 1) {
        header += '+' // keep
        if (onChompKeep) onChompKeep()
      }
      wsEnd = ws.replace(/\n$/, '')
      return ''
    })
    .replace(/^[\n ]*/, ws => {
      if (ws.indexOf(' ') !== -1) header += indentSize
      const m = ws.match(/ +$/)
      if (m) {
        wsStart = ws.slice(0, -m[0].length)
        return m[0]
      } else {
        wsStart = ws
        return ''
      }
    })
  if (wsEnd) wsEnd = wsEnd.replace(/\n+(?!\n|$)/g, `$&${indent}`)
  if (wsStart) wsStart = wsStart.replace(/\n+/g, `$&${indent}`)
  if (comment) {
    header += ' #' + comment.replace(/ ?[\r\n]+/g, ' ')
    if (onComment) onComment()
  }
  if (!value) return `${header}${indentSize}\n${indent}${wsEnd}`
  if (literal) {
    value = value.replace(/\n+/g, `$&${indent}`)
    return `${header}\n${indent}${wsStart}${value}${wsEnd}`
  }
  value = value
    .replace(/\n+/g, '\n$&')
    .replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
    //         ^ ind.line  ^ empty     ^ capture next empty lines only at end of indent
    .replace(/\n+/g, `$&${indent}`)
  const body = foldFlowLines(
    `${wsStart}${value}${wsEnd}`,
    indent,
    FOLD_BLOCK,
    getFoldOptions(ctx)
  )
  return `${header}\n${indent}${body}`
}

function plainString(
  item: StringifyScalar,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
) {
  const { comment, type, value } = item
  const { actualString, implicitKey, indent, inFlow } = ctx
  if (
    (implicitKey && /[\n[\]{},]/.test(value)) ||
    (inFlow && /[[\]{},]/.test(value))
  ) {
    return doubleQuotedString(value, ctx)
  }
  if (
    !value ||
    /^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(
      value
    )
  ) {
    const hasDouble = value.indexOf('"') !== -1
    const hasSingle = value.indexOf("'") !== -1
    let quotedString
    if (hasDouble && !hasSingle) {
      quotedString = singleQuotedString
    } else if (hasSingle && !hasDouble) {
      quotedString = doubleQuotedString
    } else if (ctx.options.singleQuote) {
      quotedString = singleQuotedString
    } else {
      quotedString = doubleQuotedString
    }
    // not allowed:
    // - empty string, '-' or '?'
    // - start with an indicator character (except [?:-]) or /[?-] /
    // - '\n ', ': ' or ' \n' anywhere
    // - '#' not preceded by a non-space char
    // - end with ' ' or ':'
    return implicitKey || inFlow || value.indexOf('\n') === -1
      ? quotedString(value, ctx)
      : blockString(item, ctx, onComment, onChompKeep)
  }
  if (
    !implicitKey &&
    !inFlow &&
    type !== Type.PLAIN &&
    value.indexOf('\n') !== -1
  ) {
    // Where allowed & type not set explicitly, prefer block style for multiline strings
    return blockString(item, ctx, onComment, onChompKeep)
  }
  if (indent === '' && containsDocumentMarker(value)) {
    ctx.forceBlockIndent = true
    return blockString(item, ctx, onComment, onChompKeep)
  }
  const str = value.replace(/\n+/g, `$&\n${indent}`)
  // Verify that output will be parsed as a string, as e.g. plain numbers and
  // booleans get parsed with those types in v1.2 (e.g. '42', 'true' & '0.9e-3'),
  // and others in v1.1.
  if (actualString) {
    for (const tag of ctx.doc.schema.tags) {
      if (
        tag.default &&
        tag.tag !== 'tag:yaml.org,2002:str' &&
        tag.test?.test(str)
      )
        return doubleQuotedString(value, ctx)
    }
  }
  const body = implicitKey
    ? str
    : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx))
  if (
    comment &&
    !inFlow &&
    (body.indexOf('\n') !== -1 || comment.indexOf('\n') !== -1)
  ) {
    if (onComment) onComment()
    return addCommentBefore(body, indent, comment)
  }
  return body
}

export function stringifyString(
  item: Scalar,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
) {
  const { implicitKey, inFlow } = ctx
  const ss: Scalar<string> =
    typeof item.value === 'string'
      ? (item as Scalar<string>)
      : Object.assign({}, item, { value: String(item.value) })

  let { type } = item
  if (type !== Type.QUOTE_DOUBLE) {
    // force double quotes on control characters & unpaired surrogates
    if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
      type = Type.QUOTE_DOUBLE
  }

  const _stringify = (_type: Type | undefined) => {
    switch (_type) {
      case Type.BLOCK_FOLDED:
      case Type.BLOCK_LITERAL:
        return implicitKey || inFlow
          ? doubleQuotedString(ss.value, ctx) // blocks are not valid inside flow containers
          : blockString(ss, ctx, onComment, onChompKeep)
      case Type.QUOTE_DOUBLE:
        return doubleQuotedString(ss.value, ctx)
      case Type.QUOTE_SINGLE:
        return singleQuotedString(ss.value, ctx)
      case Type.PLAIN:
        return plainString(ss, ctx, onComment, onChompKeep)
      default:
        return null
    }
  }

  let res = _stringify(type)
  if (res === null) {
    const { defaultKeyType, defaultStringType } = ctx.options
    const t = (implicitKey && defaultKeyType) || defaultStringType
    res = _stringify(t)
    if (res === null) throw new Error(`Unsupported default string type ${t}`)
  }
  return res
}
