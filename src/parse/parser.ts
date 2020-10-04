import { Lexer } from './lexer.js'
import { SourceTokenType, prettyToken, tokenType } from './token-type.js'

export interface SourceToken {
  type: Exclude<SourceTokenType, FlowScalar['type']>
  indent: number
  source: string
}

export interface ErrorToken {
  type: 'error'
  source: string
  message: string
}

export interface Directive {
  type: 'directive'
  source: string
}

export interface Document {
  type: 'document'
  offset: number
  start: SourceToken[]
  value?: Token
  end?: SourceToken[]
}

export interface FlowScalar {
  type: 'alias' | 'scalar' | 'single-quoted-scalar' | 'double-quoted-scalar'
  offset: number
  indent: number
  source: string
  end?: SourceToken[]
}

export interface BlockScalar {
  type: 'block-scalar'
  offset: number
  indent: number
  props: Token[]
  source?: string
}

export interface BlockMap {
  type: 'block-map'
  offset: number
  indent: number
  items: Array<
    | { start: SourceToken[]; key?: never; sep?: never; value?: never }
    | {
        start: SourceToken[]
        key: Token | null
        sep: SourceToken[]
        value?: Token
      }
  >
}

export interface BlockSequence {
  type: 'block-seq'
  offset: number
  indent: number
  items: Array<{ start: SourceToken[]; value?: Token }>
}

export interface FlowCollection {
  type: 'flow-collection'
  offset: number
  indent: number
  start: Token
  items: Token[]
  end?: Token
}

export type Token =
  | SourceToken
  | ErrorToken
  | Directive
  | Document
  | FlowScalar
  | BlockScalar
  | BlockMap
  | BlockSequence
  | FlowCollection

/** A YAML concrete syntax tree parser */
export class Parser {
  push: (token: Token) => void
  onNewLine?: (offset: number) => void

  lexer = new Lexer(ts => this.token(ts))

  /** If true, space and sequence indicators count as indentation */
  atNewLine = true

  /** If true, next token is a scalar value */
  atScalar = false

  /** Current indentation level */
  indent = 0

  offset = 0

  /** Top indicates the bode that's currently being built */
  stack: Token[] = []

  /** The source of the current token, set in parse() */
  source = ''

  /** The type of the current token, set in parse() */
  type = '' as SourceTokenType

  /**
   * @param push - Called separately with each parsed token
   * @param onNewLine - If defined, called separately with the start position of each new line
   * @public
   */
  constructor(
    push: (token: Token) => void,
    onNewLine?: (offset: number) => void
  ) {
    this.push = push
    this.onNewLine = onNewLine
  }

  /**
   * Parse `source` as a YAML stream, calling `push` with each
   * directive, document and other structure as it is completely parsed.
   * If `incomplete`, a part of the last line may be left as a buffer for the next call.
   *
   * Errors are not thrown, but pushed out as `{ type: 'error', message }` tokens.
   * @public
   */
  parse(source: string, incomplete = false) {
    if (this.onNewLine && this.offset === 0) this.onNewLine(0)
    this.lexer.lex(source, incomplete)
    if (!incomplete) while (this.stack.length > 0) this.pop()
  }

  /** Advance the parser by the `source` of one lexical token. */
  token(source: string) {
    this.source = source
    console.log('>', prettyToken(source))

    if (this.atScalar) {
      this.atScalar = false
      this.step()
      this.offset += source.length
      return
    }

    const type = tokenType(source)
    if (!type) {
      const message = `Not a YAML token: ${source}`
      this.pop({ type: 'error', source, message })
      this.offset += source.length
    } else if (type === 'scalar') {
      this.atNewLine = false
      this.atScalar = true
      this.type = 'scalar'
    } else {
      this.type = type
      this.step()
      switch (type) {
        case 'newline':
          this.atNewLine = true
          this.indent = 0
          if (this.onNewLine) this.onNewLine(this.offset + source.length)
          break
        case 'space':
        case 'seq-item-ind':
          if (this.atNewLine) this.indent += source.length
          break
        case 'doc-mode':
          return
        default:
          this.atNewLine = false
      }
      this.offset += source.length
    }
  }

  get sourceToken() {
    return {
      type: this.type,
      indent: this.indent,
      source: this.source
    } as SourceToken
  }

  step() {
    const top = this.peek()
    if (!top) return this.stream()
    switch (top.type) {
      case 'document':
        return this.document(top)
      case 'alias':
      case 'scalar':
      case 'single-quoted-scalar':
      case 'double-quoted-scalar':
        return this.scalar(top)
      case 'block-scalar':
        return this.blockScalar(top)
      case 'block-map':
        return this.blockMap(top)
      case 'block-seq':
        return this.blockSequence(top)
      case 'flow-collection':
        return this.flowCollection(top)
    }
    this.pop() // error
  }

  peek() {
    return this.stack[this.stack.length - 1]
  }

  pop(error?: Token) {
    const token = error || this.stack.pop()
    if (!token) {
      const message = 'Tried to pop an empty stack'
      this.push({ type: 'error', source: '', message })
    } else if (this.stack.length === 0) {
      this.push(token)
    } else {
      const top = this.peek()
      switch (top.type) {
        case 'document':
          top.value = token
          break
        case 'block-scalar':
          top.props.push(token) // error
          break
        case 'block-map': {
          const it = top.items[top.items.length - 1]
          if (it.value) top.items.push({ start: [], key: token, sep: [] })
          else if (it.sep) it.value = token
          else Object.assign(it, { key: token, sep: [] })
          break
        }
        case 'block-seq': {
          const it = top.items[top.items.length - 1]
          if (it.value) top.items.push({ start: [], value: token })
          else it.value = token
          break
        }
        case 'flow-collection':
          top.items.push(token)
          break
        default:
          this.pop()
          this.pop(token)
      }
    }
  }

  stream() {
    switch (this.type) {
      case 'directive-line':
        this.push({ type: 'directive', source: this.source })
        return
      case 'doc-end':
      case 'space':
      case 'comment':
      case 'newline':
        this.push(this.sourceToken)
        return
      case 'doc-mode':
      case 'doc-start': {
        const doc: Document = {
          type: 'document',
          offset: this.offset,
          start: []
        }
        if (this.type === 'doc-start') doc.start.push(this.sourceToken)
        this.stack.push(doc)
        return
      }
    }
    const message = `Unexpected ${this.type} token in YAML stream`
    this.push({ type: 'error', message, source: this.source })
  }

  document(doc: Document) {
    if (doc.value) return this.lineEnd(doc)
    switch (this.type) {
      case 'doc-start':
      case 'anchor':
      case 'tag':
      case 'space':
      case 'comment':
      case 'newline':
        doc.start.push(this.sourceToken)
        return
      case 'doc-end':
        doc.start.push(this.sourceToken)
        this.pop()
        return
    }
    const bv = this.startBlockValue()
    if (bv) this.stack.push(bv)
    else {
      const message = `Unexpected ${this.type} token in YAML document`
      this.push({ type: 'error', message, source: this.source })
    }
  }

  scalar(scalar: FlowScalar) {
    if (this.type === 'map-value-ind') {
      let sep: SourceToken[]
      if (scalar.end) {
        sep = scalar.end
        sep.push(this.sourceToken)
        delete scalar.end
      } else sep = [this.sourceToken]
      const map: BlockMap = {
        type: 'block-map',
        offset: scalar.offset,
        indent: scalar.indent,
        items: [{ start: [], key: scalar, sep }]
      }
      this.stack[this.stack.length - 1] = map
    } else this.lineEnd(scalar)
  }

  blockScalar(scalar: BlockScalar) {
    switch (this.type) {
      case 'space':
      case 'comment':
      case 'newline':
        scalar.props.push(this.sourceToken)
        return
      case 'scalar':
        scalar.source = this.source
        // block-scalar source includes trailing newline
        this.atNewLine = true
        this.indent = 0
        if (this.onNewLine) {
          let nl = this.source.indexOf('\n') + 1
          while (nl !== 0) {
            this.onNewLine(this.offset + nl)
            nl = this.source.indexOf('\n', nl) + 1
          }
        }
        this.pop()
        break
      default:
        this.pop()
        this.step()
    }
  }

  blockMap(map: BlockMap) {
    const it = map.items[map.items.length - 1]
    // it.sep is true-ish if pair already has key or : separator
    switch (this.type) {
      case 'space':
      case 'comment':
      case 'newline':
        if (it.value) map.items.push({ start: [this.sourceToken] })
        else if (it.sep) it.sep.push(this.sourceToken)
        else it.start.push(this.sourceToken)
        return
    }
    if (this.indent >= map.indent) {
      switch (this.type) {
        case 'anchor':
        case 'tag':
          if (it.value) map.items.push({ start: [this.sourceToken] })
          else if (it.sep) it.sep.push(this.sourceToken)
          else it.start.push(this.sourceToken)
          return

        case 'explicit-key-ind':
          if (!it.sep) it.start.push(this.sourceToken)
          else if (it.value || this.indent === map.indent)
            map.items.push({ start: [this.sourceToken] })
          else
            this.stack.push({
              type: 'block-map',
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            })
          return

        case 'map-value-ind':
          if (!it.sep) Object.assign(it, { key: null, sep: [this.sourceToken] })
          else if (it.value)
            map.items.push({ start: [], key: null, sep: [this.sourceToken] })
          else if (it.sep.some(tok => tok.type === 'map-value-ind'))
            this.stack.push({
              type: 'block-map',
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [], key: null, sep: [this.sourceToken] }]
            })
          else it.sep.push(this.sourceToken)
          return

        case 'alias':
        case 'scalar':
        case 'single-quoted-scalar':
        case 'double-quoted-scalar': {
          const fs = this.flowScalar(this.type)
          if (it.value) map.items.push({ start: [], key: fs, sep: [] })
          else if (it.sep) this.stack.push(fs)
          else Object.assign(it, { key: fs, sep: [] })
          return
        }

        default: {
          const bv = this.startBlockValue()
          if (bv) return this.stack.push(bv)
        }
      }
    }
    this.pop()
    this.step()
  }

  blockSequence(seq: BlockSequence) {
    const it = seq.items[seq.items.length - 1]
    switch (this.type) {
      case 'space':
      case 'comment':
      case 'newline':
        if (it.value) seq.items.push({ start: [this.sourceToken] })
        else it.start.push(this.sourceToken)
        return
      case 'anchor':
      case 'tag':
        if (it.value || this.indent <= seq.indent) break
        it.start.push(this.sourceToken)
        return
      case 'seq-item-ind':
        if (this.indent !== seq.indent) break
        if (it.value || it.start.some(tok => tok.type === 'seq-item-ind'))
          seq.items.push({ start: [this.sourceToken] })
        else it.start.push(this.sourceToken)
        return
    }
    if (this.indent > seq.indent) {
      const bv = this.startBlockValue()
      if (bv) return this.stack.push(bv)
    }
    this.pop()
    this.step()
  }

  flowCollection(fc: FlowCollection) {
    switch (this.type) {
      case 'space':
      case 'comment':
      case 'newline':
      case 'comma':
      case 'explicit-key-ind':
      case 'map-value-ind':
      case 'anchor':
      case 'tag':
        fc.items.push(this.sourceToken)
        return

      case 'alias':
      case 'scalar':
      case 'single-quoted-scalar':
      case 'double-quoted-scalar':
        fc.items.push(this.flowScalar(this.type))
        return

      case 'flow-map-end':
      case 'flow-seq-end':
        fc.end = this.sourceToken
        this.pop()
        return
    }
    const bv = this.startBlockValue()
    if (bv) return this.stack.push(bv)
    this.pop()
    this.step()
  }

  flowScalar(
    type: 'alias' | 'scalar' | 'single-quoted-scalar' | 'double-quoted-scalar'
  ) {
    if (this.onNewLine) {
      let nl = this.source.indexOf('\n') + 1
      while (nl !== 0) {
        this.onNewLine(this.offset + nl)
        nl = this.source.indexOf('\n', nl) + 1
      }
    }
    return {
      type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    } as FlowScalar
  }

  startBlockValue() {
    switch (this.type) {
      case 'alias':
      case 'scalar':
      case 'single-quoted-scalar':
      case 'double-quoted-scalar':
        return this.flowScalar(this.type)
      case 'block-scalar-header':
        return {
          type: 'block-scalar',
          offset: this.offset,
          indent: this.indent,
          props: [this.sourceToken]
        } as BlockScalar
      case 'flow-map-start':
      case 'flow-seq-start':
        return {
          type: 'flow-collection',
          offset: this.offset,
          indent: this.indent,
          start: this.sourceToken,
          items: []
        } as FlowCollection
      case 'seq-item-ind':
        return {
          type: 'block-seq',
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [this.sourceToken] }]
        } as BlockSequence
      case 'explicit-key-ind':
        return {
          type: 'block-map',
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [this.sourceToken] }]
        } as BlockMap
      case 'map-value-ind':
        return {
          type: 'block-map',
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [], key: null, sep: [this.sourceToken] }]
        } as BlockMap
    }
    return null
  }

  lineEnd(token: Document | FlowScalar) {
    switch (this.type) {
      case 'space':
      case 'comment':
      case 'newline':
        if (token.end) token.end.push(this.sourceToken)
        else token.end = [this.sourceToken]
        if (this.type === 'newline') this.pop()
        return
      default:
        this.pop()
        this.step()
        return
    }
  }
}
