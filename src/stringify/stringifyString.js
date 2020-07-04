import { addCommentBefore } from './addComment.js'
import { Type } from '../constants.js'
import { resolveScalar } from '../resolve/resolveScalar.js'
import {
  foldFlowLines,
  FOLD_BLOCK,
  FOLD_FLOW,
  FOLD_QUOTED
} from './foldFlowLines.js'
import { strOptions } from '../tags/options.js'

const getFoldOptions = ({ indentAtStart }) =>
  indentAtStart
    ? Object.assign({ indentAtStart }, strOptions.fold)
    : strOptions.fold

// Also checks for lines starting with %, as parsing the output as YAML 1.1 will
// presume that's starting a new document.
const containsDocumentMarker = str => /^(%|---|\.\.\.)/m.test(str)

function lineLengthOverLimit(str, limit) {
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

function doubleQuotedString(value, ctx) {
  const { implicitKey } = ctx
  const { jsonEncoding, minMultiLineLength } = strOptions.doubleQuoted
  const json = JSON.stringify(value)
  if (jsonEncoding) return json
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

function singleQuotedString(value, ctx) {
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

function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
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
      : !lineLengthOverLimit(value, strOptions.fold.lineWidth - indent.length)
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
    strOptions.fold
  )
  return `${header}\n${indent}${body}`
}

function plainString(item, ctx, onComment, onChompKeep) {
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
    let quotedString
    if (value.indexOf('"') !== -1 && value.indexOf("'") === -1) {
      quotedString = singleQuotedString
    } else if (value.indexOf("'") !== -1 && value.indexOf('"') === -1) {
      quotedString = doubleQuotedString
    } else if (strOptions.defaultQuoteSingle) {
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
    const { tags } = ctx.doc.schema
    const resolved = resolveScalar(str, tags, tags.scalarFallback).value
    if (typeof resolved !== 'string') return doubleQuotedString(value, ctx)
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

export function stringifyString(item, ctx, onComment, onChompKeep) {
  const { defaultType } = strOptions
  const { implicitKey, inFlow } = ctx
  let { type, value } = item
  if (typeof value !== 'string') {
    value = String(value)
    item = Object.assign({}, item, { value })
  }
  const _stringify = _type => {
    switch (_type) {
      case Type.BLOCK_FOLDED:
      case Type.BLOCK_LITERAL:
        return blockString(item, ctx, onComment, onChompKeep)
      case Type.QUOTE_DOUBLE:
        return doubleQuotedString(value, ctx)
      case Type.QUOTE_SINGLE:
        return singleQuotedString(value, ctx)
      case Type.PLAIN:
        return plainString(item, ctx, onComment, onChompKeep)
      default:
        return null
    }
  }
  if (
    type !== Type.QUOTE_DOUBLE &&
    /[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(value)
  ) {
    // force double quotes on control characters
    type = Type.QUOTE_DOUBLE
  } else if (
    (implicitKey || inFlow) &&
    (type === Type.BLOCK_FOLDED || type === Type.BLOCK_LITERAL)
  ) {
    // should not happen; blocks are not valid inside flow containers
    type = Type.QUOTE_DOUBLE
  }
  let res = _stringify(type)
  if (res === null) {
    res = _stringify(defaultType)
    if (res === null)
      throw new Error(`Unsupported default string type ${defaultType}`)
  }
  return res
}
