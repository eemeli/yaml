import type {
  SourceToken,
  Token,
  FlowScalar,
  FlowCollection,
  Document,
  BlockMap,
  BlockScalar,
  BlockSequence,
  DocumentEnd,
  TokenType
} from './cst.ts'
import { prettyToken, tokenType } from './cst.ts'
import { lex } from './lexer.ts'

function includesToken(list: SourceToken[], type: SourceToken['type']) {
  for (let i = 0; i < list.length; ++i) if (list[i].type === type) return true
  return false
}

const logToken =
  typeof process !== 'undefined' && process.env?.LOG_TOKENS
    ? (token: string) => console.log('|', prettyToken(token))
    : () => {}

function findNonEmptyIndex(list: SourceToken[]) {
  for (let i = 0; i < list.length; ++i) {
    switch (list[i].type) {
      case 'space':
      case 'comment':
      case 'newline':
        break
      default:
        return i
    }
  }
  return -1
}

function isFlowToken(
  token: Token | null | undefined
): token is FlowScalar | FlowCollection {
  switch (token?.type) {
    case 'alias':
    case 'scalar':
    case 'single-quoted-scalar':
    case 'double-quoted-scalar':
    case 'flow-collection':
      return true
    default:
      return false
  }
}

function getPrevProps(parent: Token) {
  switch (parent.type) {
    case 'document':
      return parent.start
    case 'block-map': {
      const it = parent.items[parent.items.length - 1]
      return it.sep ?? it.start
    }
    case 'block-seq':
      return parent.items[parent.items.length - 1].start
    /* istanbul ignore next should not happen */
    default:
      return []
  }
}

/** Note: May modify input array */
function getFirstKeyStartProps(prev: SourceToken[]) {
  if (prev.length === 0) return []

  let i = prev.length
  loop: while (--i >= 0) {
    switch (prev[i].type) {
      case 'doc-start':
      case 'explicit-key-ind':
      case 'map-value-ind':
      case 'seq-item-ind':
      case 'newline':
        break loop
    }
  }
  while (prev[++i]?.type === 'space') {
    /* loop */
  }
  return prev.splice(i, prev.length)
}

function fixFlowSeqItems(fc: FlowCollection) {
  if (fc.start.type === 'flow-seq-start') {
    for (const it of fc.items) {
      if (
        it.sep &&
        !it.value &&
        !includesToken(it.start, 'explicit-key-ind') &&
        !includesToken(it.sep, 'map-value-ind')
      ) {
        if (it.key) it.value = it.key
        delete it.key
        if (isFlowToken(it.value)) {
          if (it.value.end) Array.prototype.push.apply(it.value.end, it.sep)
          else it.value.end = it.sep
        } else Array.prototype.push.apply(it.start, it.sep)
        delete it.sep
      }
    }
  }
}

/**
 * A YAML concrete syntax tree (CST) parser
 *
 * ```ts
 * const src: string = ...
 * for (const token of new Parser().parse(src)) {
 *   // token: Token
 * }
 * ```
 *
 * To use the parser with a user-provided lexer:
 *
 * ```ts
 * function parse(source: string, lexTokens: string[]) {
 *   const parser = new Parser()
 *   for (const lexeme of lexTokens) parser.next(lexeme)
 *   return parser.end()
 * }
 *
 * const src: string = ...
 * for (const token of parse(src, lex(src))) {
 *   // token: Token
 * }
 * ```
 */
export class Parser {
  private onNewLine?: (offset: number) => void

  /** If true, space and sequence indicators count as indentation */
  private atNewLine = true

  /** If true, next token is a scalar value */
  private atScalar = false

  /** Current indentation level */
  private indent = 0

  /** Current offset since the start of parsing */
  offset = 0

  /** On the same line with a block map key */
  private onKeyLine = false

  /** Top indicates the node that's currently being built */
  stack: Token[] = []

  /** The source of the current token, set in parse() */
  private source = ''

  /** The type of the current token, set in parse() */
  private type = '' as TokenType

  tokens: Token[] = []

  /**
   * @param onNewLine - If defined, called separately with the start position of
   *   each new line (in `parse()`, including the start of input).
   */
  constructor(onNewLine?: (offset: number) => void) {
    this.onNewLine = onNewLine
  }

  /**
   * Parse `source` as a YAML stream.
   *
   * Errors are not thrown, but included in the result as `{ type: 'error', message }` tokens.
   *
   * @returns Tokens representing each directive, document, and other structure.
   */
  parse(source: string): Token[] {
    if (this.onNewLine && this.offset === 0) this.onNewLine(0)
    for (const lexeme of lex(source)) this.next(lexeme)
    return this.end()
  }

  /**
   * Advance the parser by the `source` of one lexical token.
   */
  next(source: string): void {
    this.source = source
    logToken(source)

    if (this.atScalar) {
      this.atScalar = false
      this.step()
      this.offset += source.length
      return
    }

    const type = tokenType(source)
    if (!type) {
      const message = `Not a YAML token: ${source}`
      this.pop({ type: 'error', offset: this.offset, message, source })
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
          if (this.atNewLine && source[0] === ' ') this.indent += source.length
          break
        case 'explicit-key-ind':
        case 'map-value-ind':
        case 'seq-item-ind':
          if (this.atNewLine) this.indent += source.length
          break
        case 'doc-mode':
        case 'flow-error-end':
          return
        default:
          this.atNewLine = false
      }
      this.offset += source.length
    }
  }

  /** Call at end of input to account for any remaining constructions */
  end(): Token[] {
    while (this.stack.length > 0) this.pop()
    return this.tokens
  }

  private get sourceToken() {
    const st: SourceToken = {
      type: this.type as SourceToken['type'],
      offset: this.offset,
      indent: this.indent,
      source: this.source
    }
    return st
  }

  private step(): void {
    const top = this.peek(1)
    if (this.type === 'doc-end' && top?.type !== 'doc-end') {
      while (this.stack.length > 0) this.pop()
      this.stack.push({
        type: 'doc-end',
        offset: this.offset,
        source: this.source
      })
      return
    }
    if (!top) {
      const token = this.stream()
      if (token) this.tokens.push(token)
      return
    }
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
      case 'doc-end':
        return this.documentEnd(top)
    }
    /* istanbul ignore next should not happen */
    this.pop()
  }

  private peek(n: number) {
    return this.stack[this.stack.length - n]
  }

  private pop(error?: Token): void {
    const token = error ?? this.stack.pop()
    /* istanbul ignore if should not happen */
    if (!token) {
      const message = 'Tried to pop an empty stack'
      this.tokens.push({
        type: 'error',
        offset: this.offset,
        source: '',
        message
      })
    } else if (this.stack.length === 0) {
      this.tokens.push(token)
    } else {
      const top = this.peek(1)
      if (token.type === 'block-scalar') {
        // Block scalars use their parent rather than header indent
        token.indent = 'indent' in top ? top.indent : 0
      } else if (token.type === 'flow-collection' && top.type === 'document') {
        // Ignore all indent for top-level flow collections
        token.indent = 0
      }
      if (token.type === 'flow-collection') fixFlowSeqItems(token)
      switch (top.type) {
        case 'document':
          top.value = token
          break
        case 'block-scalar':
          top.props.push(token) // error
          break
        case 'block-map': {
          const it = top.items[top.items.length - 1]
          if (it.value) {
            top.items.push({ start: [], key: token, sep: [] })
            this.onKeyLine = true
            return
          } else if (it.sep) {
            it.value = token
          } else {
            Object.assign(it, { key: token, sep: [] })
            this.onKeyLine = !it.explicitKey
            return
          }
          break
        }
        case 'block-seq': {
          const it = top.items[top.items.length - 1]
          if (it.value) top.items.push({ start: [], value: token })
          else it.value = token
          break
        }
        case 'flow-collection': {
          const it = top.items[top.items.length - 1]
          if (!it || it.value)
            top.items.push({ start: [], key: token, sep: [] })
          else if (it.sep) it.value = token
          else Object.assign(it, { key: token, sep: [] })
          return
        }
        /* istanbul ignore next should not happen */
        default:
          this.pop()
          this.pop(token)
      }

      if (
        (top.type === 'document' ||
          top.type === 'block-map' ||
          top.type === 'block-seq') &&
        (token.type === 'block-map' || token.type === 'block-seq')
      ) {
        const last = token.items[token.items.length - 1]
        if (
          last &&
          !last.sep &&
          !last.value &&
          last.start.length > 0 &&
          findNonEmptyIndex(last.start) === -1 &&
          (token.indent === 0 ||
            last.start.every(
              st => st.type !== 'comment' || st.indent < token.indent
            ))
        ) {
          if (top.type === 'document') top.end = last.start
          else top.items.push({ start: last.start })
          token.items.splice(-1, 1)
        }
      }
    }
  }

  private stream(): Token | null {
    switch (this.type) {
      case 'directive-line':
        return { type: 'directive', offset: this.offset, source: this.source }
      case 'byte-order-mark':
      case 'space':
      case 'comment':
      case 'newline':
        return this.sourceToken
      case 'doc-mode':
      case 'doc-start': {
        const doc: Document = {
          type: 'document',
          offset: this.offset,
          start: []
        }
        if (this.type === 'doc-start') doc.start.push(this.sourceToken)
        this.stack.push(doc)
        return null
      }
    }
    return {
      type: 'error',
      offset: this.offset,
      message: `Unexpected ${this.type} token in YAML stream`,
      source: this.source
    }
  }

  private document(doc: Document) {
    if (doc.value) return this.lineEnd(doc)
    switch (this.type) {
      case 'doc-start': {
        if (findNonEmptyIndex(doc.start) !== -1) {
          this.pop()
          this.step()
        } else {
          doc.start.push(this.sourceToken)
        }
        return
      }
      case 'anchor':
      case 'tag':
      case 'space':
      case 'comment':
      case 'newline':
        doc.start.push(this.sourceToken)
        return
    }
    const bv = this.startBlockValue(doc)
    if (bv) this.stack.push(bv)
    else {
      this.tokens.push({
        type: 'error',
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML document`,
        source: this.source
      })
    }
  }

  private scalar(scalar: FlowScalar) {
    if (this.type === 'map-value-ind') {
      const prev = getPrevProps(this.peek(2))
      const start = getFirstKeyStartProps(prev)

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
        items: [{ start, key: scalar, sep }]
      }
      this.onKeyLine = true
      this.stack[this.stack.length - 1] = map
    } else this.lineEnd(scalar)
  }

  private blockScalar(scalar: BlockScalar) {
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
      /* istanbul ignore next should not happen */
      default:
        this.pop()
        this.step()
    }
  }

  private blockMap(map: BlockMap) {
    const it = map.items[map.items.length - 1]

    // it.sep is true-ish if pair already has key or : separator
    switch (this.type) {
      case 'newline':
        this.onKeyLine = false
        if (it.value) {
          const end = 'end' in it.value ? it.value.end : undefined
          const last = Array.isArray(end) ? end[end.length - 1] : undefined
          if (last?.type === 'comment') end?.push(this.sourceToken)
          else map.items.push({ start: [this.sourceToken] })
        } else if (it.sep) {
          it.sep.push(this.sourceToken)
        } else {
          it.start.push(this.sourceToken)
        }
        return
      case 'space':
      case 'comment':
        if (it.value) {
          map.items.push({ start: [this.sourceToken] })
        } else if (it.sep) {
          it.sep.push(this.sourceToken)
        } else {
          if (this.atIndentedComment(it.start, map.indent)) {
            const prev = map.items[map.items.length - 2]
            const end = (prev?.value as { end: SourceToken[] })?.end
            if (Array.isArray(end)) {
              Array.prototype.push.apply(end, it.start)
              end.push(this.sourceToken)
              map.items.pop()
              return
            }
          }
          it.start.push(this.sourceToken)
        }
        return
    }

    if (this.indent >= map.indent) {
      const atMapIndent = !this.onKeyLine && this.indent === map.indent
      const atNextItem =
        atMapIndent &&
        (it.sep || it.explicitKey) &&
        this.type !== 'seq-item-ind'

      // For empty nodes, assign newline-separated not indented empty tokens to following node
      let start: SourceToken[] = []
      if (atNextItem && it.sep && !it.value) {
        const nl: number[] = []
        for (let i = 0; i < it.sep.length; ++i) {
          const st = it.sep[i]
          switch (st.type) {
            case 'newline':
              nl.push(i)
              break
            case 'space':
              break
            case 'comment':
              if (st.indent > map.indent) nl.length = 0
              break
            default:
              nl.length = 0
          }
        }
        if (nl.length >= 2) start = it.sep.splice(nl[1])
      }

      switch (this.type) {
        case 'anchor':
        case 'tag':
          if (atNextItem || it.value) {
            start.push(this.sourceToken)
            map.items.push({ start })
            this.onKeyLine = true
          } else if (it.sep) {
            it.sep.push(this.sourceToken)
          } else {
            it.start.push(this.sourceToken)
          }
          return

        case 'explicit-key-ind':
          if (!it.sep && !it.explicitKey) {
            it.start.push(this.sourceToken)
            it.explicitKey = true
          } else if (atNextItem || it.value) {
            start.push(this.sourceToken)
            map.items.push({ start, explicitKey: true })
          } else {
            this.stack.push({
              type: 'block-map',
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken], explicitKey: true }]
            })
          }
          this.onKeyLine = true
          return

        case 'map-value-ind':
          if (it.explicitKey) {
            if (!it.sep) {
              if (includesToken(it.start, 'newline')) {
                Object.assign(it, { key: null, sep: [this.sourceToken] })
              } else {
                const start = getFirstKeyStartProps(it.start)
                this.stack.push({
                  type: 'block-map',
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                })
              }
            } else if (it.value) {
              map.items.push({ start: [], key: null, sep: [this.sourceToken] })
            } else if (includesToken(it.sep, 'map-value-ind')) {
              this.stack.push({
                type: 'block-map',
                offset: this.offset,
                indent: this.indent,
                items: [{ start, key: null, sep: [this.sourceToken] }]
              })
            } else if (
              isFlowToken(it.key) &&
              !includesToken(it.sep, 'newline')
            ) {
              const start = getFirstKeyStartProps(it.start)
              const key = it.key
              const sep = it.sep
              sep.push(this.sourceToken)
              // @ts-expect-error type guard is wrong here
              delete it.key
              // @ts-expect-error type guard is wrong here
              delete it.sep
              this.stack.push({
                type: 'block-map',
                offset: this.offset,
                indent: this.indent,
                items: [{ start, key, sep }]
              })
            } else if (start.length > 0) {
              // Not actually at next item
              it.sep = it.sep.concat(start, this.sourceToken)
            } else {
              it.sep.push(this.sourceToken)
            }
          } else {
            if (!it.sep) {
              Object.assign(it, { key: null, sep: [this.sourceToken] })
            } else if (it.value || atNextItem) {
              map.items.push({ start, key: null, sep: [this.sourceToken] })
            } else if (includesToken(it.sep, 'map-value-ind')) {
              this.stack.push({
                type: 'block-map',
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [], key: null, sep: [this.sourceToken] }]
              })
            } else {
              it.sep.push(this.sourceToken)
            }
          }
          this.onKeyLine = true
          return

        case 'alias':
        case 'scalar':
        case 'single-quoted-scalar':
        case 'double-quoted-scalar': {
          const fs = this.flowScalar(this.type)
          if (atNextItem || it.value) {
            map.items.push({ start, key: fs, sep: [] })
            this.onKeyLine = true
          } else if (it.sep) {
            this.stack.push(fs)
          } else {
            Object.assign(it, { key: fs, sep: [] })
            this.onKeyLine = true
          }
          return
        }

        default: {
          const bv = this.startBlockValue(map)
          if (bv) {
            if (bv.type === 'block-seq') {
              if (
                !it.explicitKey &&
                it.sep &&
                !includesToken(it.sep, 'newline')
              ) {
                this.pop({
                  type: 'error',
                  offset: this.offset,
                  message: 'Unexpected block-seq-ind on same line with key',
                  source: this.source
                })
                return
              }
            } else if (atMapIndent) {
              map.items.push({ start })
            }
            this.stack.push(bv)
            return
          }
        }
      }
    }
    this.pop()
    this.step()
  }

  private blockSequence(seq: BlockSequence) {
    const it = seq.items[seq.items.length - 1]
    switch (this.type) {
      case 'newline':
        if (it.value) {
          const end = 'end' in it.value ? it.value.end : undefined
          const last = Array.isArray(end) ? end[end.length - 1] : undefined
          if (last?.type === 'comment') end?.push(this.sourceToken)
          else seq.items.push({ start: [this.sourceToken] })
        } else it.start.push(this.sourceToken)
        return
      case 'space':
      case 'comment':
        if (it.value) seq.items.push({ start: [this.sourceToken] })
        else {
          if (this.atIndentedComment(it.start, seq.indent)) {
            const prev = seq.items[seq.items.length - 2]
            const end = (prev?.value as { end: SourceToken[] })?.end
            if (Array.isArray(end)) {
              Array.prototype.push.apply(end, it.start)
              end.push(this.sourceToken)
              seq.items.pop()
              return
            }
          }
          it.start.push(this.sourceToken)
        }
        return
      case 'anchor':
      case 'tag':
        if (it.value || this.indent <= seq.indent) break
        it.start.push(this.sourceToken)
        return
      case 'seq-item-ind':
        if (this.indent !== seq.indent) break
        if (it.value || includesToken(it.start, 'seq-item-ind'))
          seq.items.push({ start: [this.sourceToken] })
        else it.start.push(this.sourceToken)
        return
    }
    if (this.indent > seq.indent) {
      const bv = this.startBlockValue(seq)
      if (bv) {
        this.stack.push(bv)
        return
      }
    }
    this.pop()
    this.step()
  }

  private flowCollection(fc: FlowCollection) {
    const it = fc.items[fc.items.length - 1]
    if (this.type === 'flow-error-end') {
      let top: Token | undefined
      do {
        this.pop()
        top = this.peek(1)
      } while (top?.type === 'flow-collection')
    } else if (fc.end.length === 0) {
      switch (this.type) {
        case 'comma':
        case 'explicit-key-ind':
          if (!it || it.sep) fc.items.push({ start: [this.sourceToken] })
          else it.start.push(this.sourceToken)
          return

        case 'map-value-ind':
          if (!it || it.value)
            fc.items.push({ start: [], key: null, sep: [this.sourceToken] })
          else if (it.sep) it.sep.push(this.sourceToken)
          else Object.assign(it, { key: null, sep: [this.sourceToken] })
          return

        case 'space':
        case 'comment':
        case 'newline':
        case 'anchor':
        case 'tag':
          if (!it || it.value) fc.items.push({ start: [this.sourceToken] })
          else if (it.sep) it.sep.push(this.sourceToken)
          else it.start.push(this.sourceToken)
          return

        case 'alias':
        case 'scalar':
        case 'single-quoted-scalar':
        case 'double-quoted-scalar': {
          const fs = this.flowScalar(this.type)
          if (!it || it.value) fc.items.push({ start: [], key: fs, sep: [] })
          else if (it.sep) this.stack.push(fs)
          else Object.assign(it, { key: fs, sep: [] })
          return
        }

        case 'flow-map-end':
        case 'flow-seq-end':
          fc.end.push(this.sourceToken)
          return
      }
      const bv = this.startBlockValue(fc)
      /* istanbul ignore else should not happen */
      if (bv) this.stack.push(bv)
      else {
        this.pop()
        this.step()
      }
    } else {
      const parent = this.peek(2)
      if (
        parent.type === 'block-map' &&
        ((this.type === 'map-value-ind' && parent.indent === fc.indent) ||
          (this.type === 'newline' &&
            !parent.items[parent.items.length - 1].sep))
      ) {
        this.pop()
        this.step()
      } else if (
        this.type === 'map-value-ind' &&
        parent.type !== 'flow-collection'
      ) {
        const prev = getPrevProps(parent)
        const start = getFirstKeyStartProps(prev)
        fixFlowSeqItems(fc)
        const sep = fc.end.splice(1, fc.end.length)
        sep.push(this.sourceToken)
        const map: BlockMap = {
          type: 'block-map',
          offset: fc.offset,
          indent: fc.indent,
          items: [{ start, key: fc, sep }]
        }
        this.onKeyLine = true
        this.stack[this.stack.length - 1] = map
      } else {
        this.lineEnd(fc)
      }
    }
  }

  private flowScalar(
    type: 'alias' | 'scalar' | 'single-quoted-scalar' | 'double-quoted-scalar'
  ): FlowScalar {
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
    }
  }

  private startBlockValue(parent: Token) {
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
          props: [this.sourceToken],
          source: ''
        } as BlockScalar
      case 'flow-map-start':
      case 'flow-seq-start':
        return {
          type: 'flow-collection',
          offset: this.offset,
          indent: this.indent,
          start: this.sourceToken,
          items: [],
          end: []
        } as FlowCollection
      case 'seq-item-ind':
        return {
          type: 'block-seq',
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [this.sourceToken] }]
        } as BlockSequence
      case 'explicit-key-ind': {
        this.onKeyLine = true
        const prev = getPrevProps(parent)
        const start = getFirstKeyStartProps(prev)
        start.push(this.sourceToken)
        return {
          type: 'block-map',
          offset: this.offset,
          indent: this.indent,
          items: [{ start, explicitKey: true }]
        } as BlockMap
      }
      case 'map-value-ind': {
        this.onKeyLine = true
        const prev = getPrevProps(parent)
        const start = getFirstKeyStartProps(prev)
        return {
          type: 'block-map',
          offset: this.offset,
          indent: this.indent,
          items: [{ start, key: null, sep: [this.sourceToken] }]
        } as BlockMap
      }
    }
    return null
  }

  private atIndentedComment(start: SourceToken[], indent: number) {
    if (this.type !== 'comment') return false
    if (this.indent <= indent) return false
    return start.every(st => st.type === 'newline' || st.type === 'space')
  }

  private documentEnd(docEnd: DocumentEnd) {
    if (this.type !== 'doc-mode') {
      if (docEnd.end) docEnd.end.push(this.sourceToken)
      else docEnd.end = [this.sourceToken]
      if (this.type === 'newline') this.pop()
    }
  }

  private lineEnd(token: Document | FlowCollection | FlowScalar) {
    switch (this.type) {
      case 'comma':
      case 'doc-start':
      case 'doc-end':
      case 'flow-seq-end':
      case 'flow-map-end':
      case 'map-value-ind':
        this.pop()
        this.step()
        break
      case 'newline':
        this.onKeyLine = false
      // fallthrough
      case 'space':
      case 'comment':
      default:
        // all other values are errors
        if (token.end) token.end.push(this.sourceToken)
        else token.end = [this.sourceToken]
        if (this.type === 'newline') this.pop()
    }
  }
}
