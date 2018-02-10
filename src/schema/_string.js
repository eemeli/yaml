import { Type } from 'raw-yaml'

function doubleQuotedString (value, indent, oneLine) {
  const json = JSON.stringify(value)
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
    if (ch === '\\') switch (json[i + 1]) {
      case 'u':
        str += json.slice(start, i)
        const code = json.substr(i + 2, 4)
        switch (code) {
          case '0000': str += '\\0'; break
          case '0007': str += '\\a'; break
          case '000b': str += '\\v'; break
          case '001b': str += '\\e'; break
          case '0085': str += '\\N'; break
          case '00a0': str += '\\_'; break
          case '2028': str += '\\L'; break
          case '2029': str += '\\P'; break
          default:
            if (code.substr(0, 2) === '00') str += '\\x' + code.substr(2)
            else str += json.substr(i, 6)
        }
        i += 5
        start = i
        break
      case 'n':
        if (oneLine) {
          i += 1
        } else {
          // folding will eat first newline
          str += json.slice(start, i - 1) + '\n\n'
          while (json[i + 2] === '\\' && json[i + 3] === 'n') {
            str += '\n'
            i += 2
          }
          str += indent
          // space after newline needs to be escaped to not be folded
          if (json[i + 2] === ' ') str += '\\'
          i += 1
          start = i
        }
        break
      default:
        i += 1
    }
  }
  return start ? str + json.slice(start) : json
}

function singleQuotedString (value, indent, oneLine) {
  if (oneLine) {
    if (/\n/.test(value)) return doubleQuotedString(value, indent, true)
  } else {
    // single quoted string can't have leading or trailing whitespace around newline
    if (/[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, indent, false)
  }
  value = value.replace(/'/g, "''").replace(/\n+/g, `$&\n${indent}`)
  return `'${value}'`
}

function blockString (value, indent, literal) {
  // block can't end in whitespace unless the last line is non-empty
  if (/\n[\t ]+$/.test(value)) return doubleQuotedString(value, indent, false)
  const indentSize = indent ? '2' : '1'  // root is at -1
  let header = literal ? '|' : '>'
  if (!value) return header + '\n'
  let wsStart = ''
  let wsEnd = ''
  value = value
    .replace(/[\n\t ]*$/, (ws) => {
      const n = ws.indexOf('\n')
      if (n === -1) {
        header += '-' // strip
        ws += '\n'
      } else if (n !== ws.length - 1) {
        header += '+' // keep
      }
      wsEnd = ws // last char is always \n
      return ''
    })
    .replace(/^[\n ]+/, (ws) => {
      if (ws.indexOf(' ') !== -1) header += indentSize
      wsStart = ws
      return ''
    })
  if (wsEnd) wsEnd = wsEnd.replace(/\n+/g, `$&${indent}`)
  if (wsStart) wsStart = wsStart.replace(/\n+/g, `$&${indent}`)
  if (!value) return `${header}${indentSize}\n${indent}${wsEnd}`
  if (literal) {
    value = value.replace(/\n+/g, `$&${indent}`)
  } else {
    value = value
      .replace(/\n+/g, '\n$&')
      .replace(/\n([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
      //          ^ ind.line  ^ empty     ^ capture next empty lines only at end of indent
      .replace(/\n+(?![\t ])/g, `$&${indent}`)
  }
  return `${header}\n${indent}${wsStart}${value}${wsEnd}`
}

function plainString (value, indent, implicitKey, inFlow) {
  if (
    (implicitKey && /[\n[\]{},]/.test(value)) ||
    (inFlow && /[[\]{},]/.test(value))
  ) {
    return doubleQuotedString(value, indent, implicitKey)
  }
  if (!value || /^[?-]?[ \t]|[\n:][ \t]|[ \t](#|\n|$)/.test(value)) {
    // not allowed:
    // - empty string
    // - start with ' ', '? ' or '- '
    // - '\n ', ': ', ' #' or ' \n' anywhere
    // - end with ' '
    return inFlow ? (
      doubleQuotedString(value, indent, implicitKey)
    ) : (
      blockString(value, indent, false)
    )
  }
  return value.replace(/\n+/g, `$&\n${indent}`)
}

export const str = {
  class: String,
  tag: 'tag:yaml.org,2002:str',
  resolve: (doc, node) => node.strValue || '',
  options: { defaultType: Type.PLAIN, dropCR: true },
  stringify: (value, { implicitKey, indent, inFlow, type } = {}) => {
    if (typeof value !== 'string') value = String(value)
    if (str.options.dropCR && /\r/.test(value)) value = value.replace(/\r\n?/g, '\n')
    const _stringify = (_type) => {
      switch (_type) {
        case Type.BLOCK_FOLDED: return blockString(value, indent, false)
        case Type.BLOCK_LITERAL: return blockString(value, indent, true)
        case Type.QUOTE_DOUBLE: return doubleQuotedString(value, indent, implicitKey)
        case Type.QUOTE_SINGLE: return singleQuotedString(value, indent, implicitKey)
        case Type.PLAIN: return plainString(value, indent, implicitKey, inFlow)
        default: return null
      }
    }
    if (type !== Type.QUOTE_DOUBLE && /[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(value)) {
      // force double quotes on control characters
      type = Type.QUOTE_DOUBLE
    } else if (inFlow && (type === Type.BLOCK_FOLDED || type === Type.BLOCK_LITERAL)) {
      // should not happen; blocks are not valid inside flow containers
      type = Type.QUOTE_DOUBLE
    }
    let res = _stringify(type)
    if (res === null) {
      res = _stringify(str.options.defaultType)
      if (res === null) throw new Error(`Unsupported default string type ${str.options.defaultType}`)
    }
    return res
  }
}

export default [
  str
]
