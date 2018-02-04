import { Type } from 'raw-yaml'

function doubleQuotedString (value, oneLine) {
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

function singleQuotedString (value, oneLine) {
  if (oneLine) {
    if (/\n/.test(value)) return doubleQuotedString(value, true)
  } else {
    // single quoted string can't have leading or trailing whitespace around newline
    if (/[ \t]\n|\n[ \t]/.test(value)) return doubleQuotedString(value, false)
  }
  value = value.replace(/'/g, "''").replace(/\n+/g, '\n$&')
  return `'${value}'`
}

function blockString (value, literal) {
  // block can't end in whitespace unless the last line is non-empty
  if (/\n[\t ]+$/.test(value)) return doubleQuotedString(value, false)
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
      if (ws.indexOf(' ') !== -1) header += '\v' // replaced in wrapper
      wsStart = ws
      return ''
    })
  if (!value) return header + '\v\n' + wsEnd
  if (!literal) {
    value = value
      .replace(/\n+/g, '\n$&')
      .replace(/\n([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, '$1$2') // more-indented lines aren't folded
      //          ^ ind.line  ^ empty     ^ capture next empty lines only at end of indent
  }
  return header + '\n' + wsStart + value + wsEnd
}

function plainString (value, implicitKey, inFlow) {
  if (
    (implicitKey && /[\n[\]{},]/.test(value)) ||
    (inFlow && /[[\]{},]/.test(value))
  ) {
    return doubleQuotedString(value, implicitKey)
  }
  if (!value || /^[?-]?[ \t]|[\n:][ \t]|[ \t](#|\n|$)/.test(value)) {
    // not allowed:
    // - empty string
    // - start with ' ', '? ' or '- '
    // - '\n ', ': ', ' #' or ' \n' anywhere
    // - end with ' '
    return inFlow ? (
      doubleQuotedString(value, implicitKey)
    ) : (
      blockString(value, false)
    )
  }
  return value.replace(/\n+/g, '\n$&')
}

export const str = {
  tag: 'tag:yaml.org,2002:str',
  resolve: (doc, node) => node.strValue || '',
  options: { defaultType: Type.PLAIN, dropCR: true },
  stringify: (value, { implicitKey, inFlow, type } = {}) => {
    if (typeof value !== 'string') value = String(value)
    if (str.options.dropCR && /\r/.test(value)) value = value.replace(/\r\n?/g, '\n')
    const _stringify = (_type) => {
      switch (_type) {
        case Type.BLOCK_FOLDED: return blockString(value, false)
        case Type.BLOCK_LITERAL: return blockString(value, true)
        case Type.QUOTE_DOUBLE: return doubleQuotedString(value, implicitKey)
        case Type.QUOTE_SINGLE: return singleQuotedString(value, implicitKey)
        case Type.PLAIN: return plainString(value, implicitKey, inFlow)
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
