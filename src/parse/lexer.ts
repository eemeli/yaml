import { BOM, DOCUMENT, FLOW_END, SCALAR } from './cst.ts'

function isEmpty(ch: string) {
  switch (ch) {
    case undefined:
    case ' ':
    case '\n':
    case '\r':
    case '\t':
      return true
    default:
      return false
  }
}

const hexDigits = new Set('0123456789ABCDEFabcdef')
const tagChars = new Set(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()"
)
const flowIndicatorChars = new Set(',[]{}')
const invalidAnchorChars = new Set(' ,[]{}\n\r\t')
const isNotAnchorChar = (ch: string) => !ch || invalidAnchorChars.has(ch)

/**
 * Splits an input `source` string into lexical YAML tokens,
 * i.e. smaller strings that are easily identifiable by `tokens.tokenType()`.
 *
 * Lexing starts always in a "stream" context.
 *
 * In addition to slices of the original input, the following control characters
 * may also be emitted:
 *
 * - `\x02` (Start of Text): A document starts with the next token
 * - `\x18` (Cancel): Unexpected end of flow-mode (indicates an error)
 * - `\x1f` (Unit Separator): Next token is a scalar value
 * - `\u{FEFF}` (Byte order mark): Emitted separately outside documents
 */
export function lex(source: string): string[] {
  if (typeof source !== 'string') throw TypeError('source is not a string')
  const lexer = new Lexer(source)
  const end = source.length
  let state: 'stream' | 'document' | 'flow' = 'stream'
  while (lexer.pos < end) state = lexer[state]()
  return lexer.tokens
}

class Lexer {
  /**
   * Explicit indent set in block scalar header, as an offset from the current
   * minimum indent, so e.g. set to 1 from a header `|2+`. Set to -1 if not
   * explicitly set.
   */
  private blockScalarIndent = -1

  /**
   * Block scalars that include a + (keep) chomping indicator in their header
   * include trailing empty lines, which are otherwise excluded from the
   * scalar's contents.
   */
  private blockScalarKeep = false

  /** Current input */
  private source = ''

  /**
   * Flag noting whether the map value indicator : can immediately follow this
   * node within a flow context.
   */
  private flowKey = false

  /** Count of surrounding flow collection levels. */
  private flowLevel = 0

  /**
   * Minimum level of indentation required for next lines to be parsed as a
   * part of the current scalar value.
   */
  private indentNext = 0

  /** Indentation level of the current line. */
  private indentValue = 0

  /** Position of the next \n character. */
  private lineEndPos: number | null = null

  /** A pointer to `source`; the current position of the lexer. */
  pos = 0

  tokens: string[] = []

  constructor(source: string) {
    this.source = source
  }

  private charAt(n: number): string {
    return this.source[this.pos + n]
  }

  private continueScalar(offset: number): number {
    let ch = this.source[offset]
    if (this.indentNext > 0) {
      let indent = 0
      while (ch === ' ') ch = this.source[++indent + offset]
      if (ch === '\r') {
        const next = this.source[indent + offset + 1]
        if (next === '\n') return offset + indent + 1
      }
      return ch === '\n' || indent >= this.indentNext ? offset + indent : -1
    }
    if (ch === '-' || ch === '.') {
      const dt = this.source.substr(offset, 3)
      if ((dt === '---' || dt === '...') && isEmpty(this.source[offset + 3]))
        return -1
    }
    return offset
  }

  private getLine(): string {
    let end = this.lineEndPos
    if (typeof end !== 'number' || (end !== -1 && end < this.pos)) {
      end = this.source.indexOf('\n', this.pos)
      this.lineEndPos = end
    }
    if (end === -1) return this.source.substring(this.pos)
    if (this.source[end - 1] === '\r') end -= 1
    return this.source.substring(this.pos, end)
  }

  stream(): 'stream' | 'document' {
    const line = this.getLine()

    if (line[0] === BOM) {
      this.count(1)
      return 'stream'
    }

    // Directives
    if (line[0] === '%') {
      let dirEnd = line.length
      let cs = line.indexOf('#')
      while (cs !== -1) {
        const ch = line[cs - 1]
        if (ch === ' ' || ch === '\t') {
          dirEnd = cs - 1
          break
        } else {
          cs = line.indexOf('#', cs + 1)
        }
      }
      while (true) {
        const ch = line[dirEnd - 1]
        if (ch === ' ' || ch === '\t') dirEnd -= 1
        else break
      }
      const n = this.count(dirEnd) + this.spaces(true)
      this.count(line.length - n) // possible comment
      this.newline()
      return 'stream'
    }

    // Comments and empty lines
    let i = this.pos
    let ch = this.source[i]
    while (ch === ' ' || ch === '\t') ch = this.source[++i]
    if (
      !ch ||
      ch === '#' ||
      ch === '\n' ||
      (ch === '\r' && this.source[i + 1] === '\n')
    ) {
      const sp = this.spaces(true)
      this.count(line.length - sp)
      this.newline()
      return 'stream'
    }

    this.tokens.push(DOCUMENT)
    return this.lineStart()
  }

  private lineStart(): 'stream' | 'document' {
    const ch = this.charAt(0)
    if (ch === '-' || ch === '.') {
      const s = this.source.substring(this.pos, this.pos + 3)
      if (s === '---' && isEmpty(this.charAt(3))) {
        this.count(3)
        this.indentValue = 0
        this.indentNext = 0
        return 'document'
      } else if (s === '...' && isEmpty(this.charAt(3))) {
        this.count(3)
        this.spaces(true)
        if (this.charAt(0) === '#') {
          const line = this.getLine()
          this.tokens.push(line)
          this.pos += line.length
        }
        this.newline()
        this.indentValue = 0
        this.indentNext = 0
        return 'stream'
      }
    }
    this.indentValue = this.spaces(false)
    if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
      this.indentNext = this.indentValue
    this.blockStart()
    return 'document'
  }

  private blockStart(): void {
    const ch = this.charAt(0)
    if ((ch === '-' || ch === '?' || ch === ':') && isEmpty(this.charAt(1))) {
      const n = this.count(1) + this.spaces(true)
      this.indentNext = this.indentValue + 1
      this.indentValue += n
      this.blockStart()
    }
  }

  document(): 'stream' | 'document' | 'flow' {
    this.spaces(true)
    const line = this.getLine()
    let n = this.indicators()
    switch (line[n]) {
      case '#':
        this.count(line.length - n)
      // fallthrough
      case undefined:
        this.newline()
        return this.lineStart()
      case '{':
      case '[':
        this.count(1)
        this.flowKey = false
        this.flowLevel = 1
        return 'flow'
      case '}':
      case ']':
        // this is an error
        this.count(1)
        return 'document'
      case '*':
        this.until(isNotAnchorChar)
        return 'document'
      case '"':
      case "'":
        this.quotedScalar()
        return 'document'
      case '|':
      case '>':
        n += this.blockScalarHeader()
        n += this.spaces(true)
        this.count(line.length - n)
        this.newline()
        this.blockScalar()
        return this.lineStart()
      default:
        this.plainScalar()
        return 'document'
    }
  }

  flow(): 'stream' | 'document' | 'flow' {
    let nl: number, sp: number
    let indent = -1
    do {
      nl = this.newline()
      if (nl > 0) {
        sp = this.spaces(false)
        this.indentValue = indent = sp
      } else {
        sp = 0
      }
      sp += this.spaces(true)
    } while (nl + sp > 0)
    const line = this.getLine()
    if (
      (indent !== -1 && indent < this.indentNext && line[0] !== '#') ||
      (indent === 0 &&
        (line.startsWith('---') || line.startsWith('...')) &&
        isEmpty(line[3]))
    ) {
      // Allowing for the terminal ] or } at the same (rather than greater)
      // indent level as the initial [ or { is technically invalid, but
      // failing here would be surprising to users.
      const atFlowEndMarker =
        indent === this.indentNext - 1 &&
        this.flowLevel === 1 &&
        (line[0] === ']' || line[0] === '}')
      if (!atFlowEndMarker) {
        // this is an error
        this.flowLevel = 0
        this.tokens.push(FLOW_END)
        return this.lineStart()
      }
    }
    let n = 0
    while (line[n] === ',') {
      n += this.count(1)
      n += this.spaces(true)
      this.flowKey = false
    }
    n += this.indicators()
    switch (line[n]) {
      case undefined:
        break
      case '#':
        this.count(line.length - n)
        break
      case '{':
      case '[':
        this.count(1)
        this.flowKey = false
        this.flowLevel += 1
        break
      case '}':
      case ']':
        this.count(1)
        this.flowKey = true
        this.flowLevel -= 1
        return this.flowLevel ? 'flow' : 'document'
      case '*':
        this.until(isNotAnchorChar)
        break
      case '"':
      case "'":
        this.flowKey = true
        this.quotedScalar()
        break
      case ':': {
        const next = this.charAt(1)
        if (this.flowKey || isEmpty(next) || next === ',') {
          this.flowKey = false
          this.count(1)
          this.spaces(true)
          break
        }
      }
      // fallthrough
      default:
        this.flowKey = false
        this.plainScalar()
    }
    return 'flow'
  }

  private quotedScalar(): void {
    const quote = this.charAt(0)
    let end = this.source.indexOf(quote, this.pos + 1)
    if (quote === "'") {
      while (end !== -1 && this.source[end + 1] === "'")
        end = this.source.indexOf("'", end + 2)
    } else {
      // double-quote
      while (end !== -1) {
        let n = 0
        while (this.source[end - 1 - n] === '\\') n += 1
        if (n % 2 === 0) break
        end = this.source.indexOf('"', end + 1)
      }
    }
    // Only looking for newlines within the quotes
    const qb = this.source.substring(0, end)
    let nl = qb.indexOf('\n', this.pos)
    if (nl !== -1) {
      while (nl !== -1) {
        const cs = this.continueScalar(nl + 1)
        if (cs === -1) break
        nl = qb.indexOf('\n', cs)
      }
      if (nl !== -1) {
        // this is an error caused by an unexpected unindent
        end = nl - (qb[nl - 1] === '\r' ? 2 : 1)
      }
    }
    if (end === -1) end = this.source.length
    this.toIndex(end + 1, false)
  }

  private blockScalarHeader(): number {
    this.blockScalarIndent = -1
    this.blockScalarKeep = false
    let i = this.pos
    while (true) {
      const ch = this.source[++i]
      if (ch === '+') this.blockScalarKeep = true
      else if (ch > '0' && ch <= '9') this.blockScalarIndent = Number(ch) - 1
      else if (ch !== '-') break
    }
    return this.until(ch => isEmpty(ch) || ch === '#')
  }

  private blockScalar(): void {
    let nl = this.pos - 1 // may be -1 if this.pos === 0
    let indent = 0
    let ch: string
    loop: for (let i = this.pos; (ch = this.source[i]); ++i) {
      switch (ch) {
        case ' ':
          indent += 1
          break
        case '\n':
          nl = i
          indent = 0
          break
        case '\r':
          if (this.source[i + 1] === '\n') break
        // fallthrough
        default:
          break loop
      }
    }
    if (indent >= this.indentNext) {
      if (this.blockScalarIndent === -1) this.indentNext = indent
      else {
        this.indentNext =
          this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext)
      }
      do {
        const cs = this.continueScalar(nl + 1)
        if (cs === -1) break
        nl = this.source.indexOf('\n', cs)
      } while (nl !== -1)
      if (nl === -1) nl = this.source.length
    }

    // Trailing insufficiently indented tabs are invalid.
    // To catch that during parsing, we include them in the block scalar value.
    let i = nl + 1
    ch = this.source[i]
    while (ch === ' ') ch = this.source[++i]
    if (ch === '\t') {
      while (ch === '\t' || ch === ' ' || ch === '\r' || ch === '\n')
        ch = this.source[++i]
      nl = i - 1
    } else if (!this.blockScalarKeep) {
      do {
        let i = nl - 1
        let ch = this.source[i]
        if (ch === '\r') ch = this.source[--i]
        const lastChar = i // Drop the line if last char not more indented
        while (ch === ' ') ch = this.source[--i]
        if (ch === '\n' && i >= this.pos && i + 1 + indent > lastChar) nl = i
        else break
      } while (true)
    }
    this.tokens.push(SCALAR)
    this.toIndex(nl + 1, true)
  }

  private plainScalar(): void {
    const inFlow = this.flowLevel > 0
    let end = this.pos - 1
    let i = this.pos - 1
    let ch: string
    while ((ch = this.source[++i])) {
      if (ch === ':') {
        const next = this.source[i + 1]
        if (isEmpty(next) || (inFlow && flowIndicatorChars.has(next))) break
        end = i
      } else if (isEmpty(ch)) {
        let next = this.source[i + 1]
        if (ch === '\r') {
          if (next === '\n') {
            i += 1
            ch = '\n'
            next = this.source[i + 1]
          } else end = i
        }
        if (next === '#' || (inFlow && flowIndicatorChars.has(next))) break
        if (ch === '\n') {
          const cs = this.continueScalar(i + 1)
          if (cs === -1) break
          i = Math.max(i, cs - 2) // to advance, but still account for ' #'
        }
      } else {
        if (inFlow && flowIndicatorChars.has(ch)) break
        end = i
      }
    }
    this.tokens.push(SCALAR)
    this.toIndex(end + 1, true)
  }

  private count(n: number): number {
    if (n > 0) {
      const s = this.source.substr(this.pos, n)
      this.tokens.push(s)
      this.pos += n
      return n
    }
    return 0
  }

  private toIndex(i: number, allowEmpty: boolean): number {
    const s = this.source.slice(this.pos, i)
    if (s) {
      this.tokens.push(s)
      this.pos += s.length
    } else if (allowEmpty) {
      this.tokens.push('')
    }
    return s.length
  }

  private indicators(): number {
    switch (this.charAt(0)) {
      case '!':
        return this.tag() + this.spaces(true) + this.indicators()
      case '&':
        return (
          this.until(isNotAnchorChar) + this.spaces(true) + this.indicators()
        )
      case '-': // this is an error
      case '?': // this is an error outside flow collections
      case ':': {
        const inFlow = this.flowLevel > 0
        const ch1 = this.charAt(1)
        if (isEmpty(ch1) || (inFlow && flowIndicatorChars.has(ch1))) {
          if (!inFlow) this.indentNext = this.indentValue + 1
          else if (this.flowKey) this.flowKey = false
          return this.count(1) + this.spaces(true) + this.indicators()
        }
      }
    }
    return 0
  }

  private tag(): number {
    if (this.charAt(1) === '<') {
      let i = this.pos + 2
      let ch = this.source[i]
      while (!isEmpty(ch) && ch !== '>') ch = this.source[++i]
      return this.toIndex(ch === '>' ? i + 1 : i, false)
    } else {
      let i = this.pos + 1
      let ch = this.source[i]
      while (ch) {
        if (tagChars.has(ch)) ch = this.source[++i]
        else if (
          ch === '%' &&
          hexDigits.has(this.source[i + 1]) &&
          hexDigits.has(this.source[i + 2])
        ) {
          ch = this.source[(i += 3)]
        } else break
      }
      return this.toIndex(i, false)
    }
  }

  private newline(): number {
    const ch = this.source[this.pos]
    if (ch === '\n') return this.count(1)
    else if (ch === '\r' && this.charAt(1) === '\n') return this.count(2)
    else return 0
  }

  private spaces(allowTabs: boolean): number {
    let i = this.pos - 1
    let ch: string
    do {
      ch = this.source[++i]
    } while (ch === ' ' || (allowTabs && ch === '\t'))
    const n = i - this.pos
    if (n > 0) {
      const s = this.source.substr(this.pos, n)
      this.tokens.push(s)
      this.pos = i
    }
    return n
  }

  private until(test: (ch: string) => boolean): number {
    let i = this.pos
    let ch = this.source[i]
    while (!test(ch)) ch = this.source[++i]
    return this.toIndex(i, false)
  }
}
