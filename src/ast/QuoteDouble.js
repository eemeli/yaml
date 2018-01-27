import Node from './Node'
import Range from './Range'

const parseCharCode = (src, offset, length) => {
  const cc = src.substr(offset, length)
  const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc)
  const code = ok ? parseInt(cc, 16) : NaN
  if (isNaN(code)) throw new SyntaxError(`Invalid escape sequence ${src.substr(offset - 2, length + 2)}`)
  return String.fromCodePoint(code)
}

export default class QuoteDouble extends Node {
  static endOfQuote (src, offset) {
    let ch = src[offset]
    while (ch && ch !== '"') {
      offset += (ch === '\\') ? 2 : 1
      ch = src[offset]
    }
    return offset + 1
  }

  get strValue () {
    if (!this.valueRange || !this.context) return null
    const { start, end } = this.valueRange
    const { src } = this.context
    // Using String#replace is too painful with escaped newlines preceded by
    // escaped backslashes; also, this should be faster.
    let str = ''
    for (let i = start + 1; i < end - 1; ++i) {
      let ch = src[i]
      if (ch === '\n') {
        // fold single newline into space, multiple newlines to just one
        let nlCount = 1
        ch = src[i + 1]
        while (ch === ' ' || ch === '\t' || ch === '\n') {
          if (ch === '\n') ++nlCount
          i += 1
          ch = src[i + 1]
        }
        str += nlCount > 1 ? '\n' : ' '
      } else if (ch === '\\') {
        i += 1
        switch (src[i]) {
          case '0':  str += '\0';      break  // null character
          case 'a':  str += '\x07';    break  // bell character
          case 'b':  str += '\b';      break  // backspace
          case 'e':  str += '\x1b';    break  // escape character
          case 'f':  str += '\f';      break  // form feed
          case 'n':  str += '\n';      break  // line feed
          case 'r':  str += '\r';      break  // carriage return
          case 't':  str += '\t';      break  // horizontal tab
          case 'v':  str += '\v';      break  // vertical tab
          case 'N':  str += '\u0085';  break  // Unicode next line
          case '_':  str += '\u00a0';  break  // Unicode non-breaking space
          case 'L':  str += '\u2028';  break  // Unicode line separator
          case 'P':  str += '\u2029';  break  // Unicode paragraph separator
          case ' ':  str += ' ';       break
          case '"':  str += '"';       break
          case '/':  str += '/';       break
          case '\\': str += '\\';      break
          case '\t': str += '\t';      break
          case 'x':  str += parseCharCode(src, i + 1, 2);  i += 2;  break
          case 'u':  str += parseCharCode(src, i + 1, 4);  i += 4;  break
          case 'U':  str += parseCharCode(src, i + 1, 8);  i += 8;  break
          case '\n':
            // skip escaped newlines, but still trim the following line
            while (src[i + 1] === ' ' || src[i + 1] === '\t') i += 1
            break
          default: throw new SyntaxError(`Invalid escape sequence ${src.substr(i - 1, 2)}`)
        }
      } else if (ch === ' ' || ch === '\t') {
        // trim trailing whitespace
        const wsStart = i
        let next = src[i + 1]
        while (next === ' ' || next === '\t') {
          i += 1
          next = src[i + 1]
        }
        if (next !== '\n') str += i > wsStart ? src.slice(wsStart, i + 1) : ch
      } else {
        str += ch
      }
    }
    return str
  }

  /**
   * Parses a "double quoted" value from the source
   *
   * @param {ParseContext} context
   * @param {number} start - Index of first character
   * @returns {number} - Index of the character after this scalar
   */
  parse (context, start) {
    this.context = context
    const { src } = context
    let offset = QuoteDouble.endOfQuote(src, start + 1)
    this.valueRange = new Range(start, offset)
    offset = Node.endOfWhiteSpace(src, offset)
    offset = this.parseComment(offset)
    trace: this.type, { valueRange: this.valueRange, comment: this.comment }, JSON.stringify(this.rawValue)
    return offset
  }
}
