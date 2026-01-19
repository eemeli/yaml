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

const flowIndicatorChars = new Set(',[]{}')
const invalidAnchorChars = new Set(' ,[]{}\n\r\t')
const isNotAnchorChar = (ch: string) => !ch || invalidAnchorChars.has(ch)

const blockScalarHeader = /([|>][^\s#]*)([ \t]*)([^\r\n]*)$/my
const blockStart = /([-?:])(?=[ \n\r\t]|$)([ \t]*)/y
const directiveLine = /(%.*?)(?:([ \t]+)(#.*)?)?$/my
const docMarker = /[-.]{3}(?=[ \n\r\t]|$)(?:([ \t]+)(#.*)?)?/y
const emptyLineOrComment = /([ \t]*)(#.*)?$/my
const indicator =
  //  |anchor       |explicit tag |implicit tag                                 |block start           |block start in flow   |spaces
  /(?:(&[^\s,[\]{}]*|!<[^\s>]*>?|!(?:[0-9a-z-#;/?:@&=+$_.!~*'()]|%[0-9a-f]{2})*)|([-?:])(?=[ \n\r\t]|$)|([-?:])(?=[,[\]{}]|$))([ \t]*)/iy

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
    if (this.indentNext > 0) {
      let ch = this.source[offset]
      let indent = 0
      while (ch === ' ') ch = this.source[++indent + offset]
      if (ch === '\r') {
        const next = this.source[indent + offset + 1]
        // \r\n is a single line break
        if (next === '\n') return offset + indent + 1
        // standalone \r is also a line break per YAML 1.2 spec
        return offset + indent
      }
      return ch === '\n' || indent >= this.indentNext ? offset + indent : -1
    }
    docMarker.lastIndex = offset
    return docMarker.test(this.source) ? -1 : offset
  }

  stream(): 'stream' | 'document' {
    if (this.charAt(0) === BOM) {
      this.count(1)
      return 'stream'
    }

    // Directives
    directiveLine.lastIndex = this.pos
    let m = directiveLine.exec(this.source)
    if (m) {
      const [line, directive, spaces, comment] = m
      this.tokens.push(directive)
      if (spaces) this.tokens.push(spaces)
      if (comment) this.tokens.push(comment)
      this.pos += line.length
      this.newline()
      return 'stream'
    }

    // Comments and empty lines
    emptyLineOrComment.lastIndex = this.pos
    m = emptyLineOrComment.exec(this.source)
    if (m) {
      const [line, spaces, comment] = m
      if (spaces) this.tokens.push(spaces)
      if (comment) this.tokens.push(comment)
      this.pos += line.length
      this.newline()
      return 'stream'
    }

    this.tokens.push(DOCUMENT)
    return this.lineStart()
  }

  private lineStart(): 'stream' | 'document' {
    docMarker.lastIndex = this.pos
    const dmm = docMarker.exec(this.source)
    if (dmm) {
      const [line, spaces, comment] = dmm
      this.count(3)
      if (spaces) {
        this.tokens.push(spaces)
        this.pos += spaces.length
      }
      if (comment) {
        this.tokens.push(comment)
        this.pos += comment.length
      }
      this.newline()
      this.indentValue = 0
      this.indentNext = 0
      return line.startsWith('-') ? this.lineStart() : 'stream'
    }

    this.indentValue = this.spaces(false)
    if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
      this.indentNext = this.indentValue
    blockStart.lastIndex = this.pos
    let bsm
    while ((bsm = blockStart.exec(this.source))) {
      const [line, indicator, spaces] = bsm
      this.tokens.push(indicator)
      if (spaces) this.tokens.push(spaces)
      this.pos += line.length
      this.indentNext = this.indentValue + 1
      this.indentValue += line.length
    }
    return 'document'
  }

  document(): 'stream' | 'document' | 'flow' {
    this.spaces(true)
    this.indicators()
    switch (this.charAt(0)) {
      case '#':
        this.toLineEnd()
      // fallthrough
      case '\n':
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
        this.blockScalar()
        return this.lineStart()
      case '\r':
        // \r\n and standalone \r are both line breaks
        if (this.charAt(1) === '\n') {
          this.count(2)
        } else {
          this.count(1)
        }
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
    let ch = this.charAt(0)
    if (
      indent !== -1 &&
      indent < this.indentNext &&
      ch !== '#' &&
      // Allowing for the terminal ] or } at the same (rather than greater)
      // indent level as the initial [ or { is technically invalid, but
      // failing here would be surprising to users.
      !(
        indent === this.indentNext - 1 &&
        this.flowLevel === 1 &&
        (ch === ']' || ch === '}')
      )
    ) {
      // this is an error
      this.flowLevel = 0
      this.tokens.push(FLOW_END)
      return this.lineStart()
    }
    if (indent === 0) {
      docMarker.lastIndex = this.pos
      if (docMarker.test(this.source)) {
        // this is an error
        this.flowLevel = 0
        this.tokens.push(FLOW_END)
        return this.lineStart()
      }
    }
    while (ch === ',') {
      this.count(1)
      this.spaces(true)
      this.flowKey = false
      ch = this.charAt(0)
    }
    if (this.indicators()) ch = this.charAt(0)
    switch (ch) {
      case '\n':
      case undefined:
        break
      case '#':
        this.toLineEnd()
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
        if (this.flowKey) {
          this.flowKey = false
          this.count(1)
          this.spaces(true)
        } else {
          const next = this.charAt(1)
          if (isEmpty(next) || next === ',') {
            this.count(1)
            this.spaces(true)
          } else {
            this.plainScalar()
          }
        }
        break
      }
      case '\r':
        // standalone \r is a line break, handled by newline() in loop
        break
      default:
        this.flowKey = false
        this.plainScalar()
    }
    return 'flow'
  }

  private indicators(): boolean {
    let hasIndicators = false
    indicator.lastIndex = this.pos
    let m
    while ((m = indicator.exec(this.source))) {
      hasIndicators ||= true
      const [fm, tagOrAnchor, bsEmpty, bsInFlow, spaces] = m
      if (tagOrAnchor) {
        this.tokens.push(tagOrAnchor)
      } else if (this.flowLevel > 0) {
        this.tokens.push(bsEmpty ?? bsInFlow)
        this.flowKey &&= false
      } else if (bsEmpty) {
        this.tokens.push(bsEmpty)
        this.indentNext = this.indentValue + 1
      } else break
      if (spaces) this.tokens.push(spaces)
      this.pos += fm.length
    }
    return hasIndicators
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
    let nl = this.findLineBreak(qb, this.pos)
    if (nl !== -1) {
      while (nl !== -1) {
        const cs = this.continueScalar(nl + 1)
        if (cs === -1) break
        nl = this.findLineBreak(qb, cs)
      }
      if (nl !== -1) {
        // this is an error caused by an unexpected unindent
        end = nl - (qb[nl - 1] === '\r' ? 2 : 1)
      }
    }
    if (end === -1) end = this.source.length
    this.toIndex(end + 1, false)
  }

  private blockScalar(): void {
    let bsIndent = -1
    let bsKeep = false
    blockScalarHeader.lastIndex = this.pos
    const [line, header, spaces, comment] = blockScalarHeader.exec(this.source)!
    for (const ch of header) {
      if (ch === '+') bsKeep = true
      else if (ch > '0' && ch <= '9') bsIndent = Number(ch) - 1
    }
    this.tokens.push(header)
    if (spaces) this.tokens.push(spaces)
    if (comment) this.tokens.push(comment)
    this.pos += line.length
    this.newline()

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
          nl = i
          indent = 0
          if (this.source[i + 1] === '\n') i++ // skip \n in \r\n
          break
        default:
          break loop
      }
    }
    if (indent >= this.indentNext) {
      if (bsIndent === -1) this.indentNext = indent
      else {
        this.indentNext =
          bsIndent + (this.indentNext === 0 ? 1 : this.indentNext)
      }
      do {
        const cs = this.continueScalar(nl + 1)
        if (cs === -1) break
        nl = this.findLineBreak(this.source, cs)
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
    } else if (!bsKeep) {
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
          }
          // standalone \r is also a line break
        }
        if (next === '#' || (inFlow && flowIndicatorChars.has(next))) break
        if (ch === '\n' || ch === '\r') {
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

  private toLineEnd(): number {
    let i = this.pos
    let ch = this.source[i]
    // stop at \n or standalone \r
    while (ch && ch !== '\n' && ch !== '\r') ch = this.source[++i]
    return this.toIndex(i, false)
  }

  private findLineBreak(str: string, pos: number): number {
    const nl = str.indexOf('\n', pos)
    const cr = str.indexOf('\r', pos)
    if (cr !== -1 && (nl === -1 || cr < nl - 1)) return cr
    return nl
  }

  private newline(): number {
    const ch = this.source[this.pos]
    if (ch === '\n') return this.count(1)
    if (ch === '\r') {
      if (this.charAt(1) === '\n') return this.count(2)
      return this.count(1)
    }
    return 0
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
