import { Directives } from '../doc/directives.js'
import { Document } from '../doc/Document.js'
import { ErrorCode, YAMLParseError, YAMLWarning } from '../errors.js'
import { isCollection } from '../nodes/Node.js'
import {
  defaultOptions,
  DocumentOptions,
  ParseOptions,
  SchemaOptions
} from '../options.js'
import type { Token } from '../parse/tokens.js'
import { composeDoc } from './compose-doc.js'
import { resolveEnd } from './resolve-end.js'

function parsePrelude(prelude: string[]) {
  let comment = ''
  let atComment = false
  let afterEmptyLine = false
  for (let i = 0; i < prelude.length; ++i) {
    const source = prelude[i]
    switch (source[0]) {
      case '#':
        comment +=
          (comment === '' ? '' : afterEmptyLine ? '\n\n' : '\n') +
          source.substring(1)
        atComment = true
        afterEmptyLine = false
        break
      case '%':
        if (prelude[i + 1][0] !== '#') i += 1
        atComment = false
        break
      default:
        // This may be wrong after doc-end, but in that case it doesn't matter
        if (!atComment) afterEmptyLine = true
        atComment = false
    }
  }
  return { comment, afterEmptyLine }
}

/**
 * Compose a stream of CST nodes into a stream of YAML Documents.
 *
 * ```ts
 * const options = { ... }
 * const docs: Document.Parsed[] = []
 * const composer = new Composer(doc => docs.push(doc), options)
 * const parser = new Parser(composer.next)
 * parser.parse(source)
 * composer.end()
 * ```
 */
export class Composer {
  private directives: Directives
  private doc: Document.Parsed | null = null
  private onDocument: (doc: Document.Parsed) => void
  private options: ParseOptions & DocumentOptions & SchemaOptions
  private atDirectives = false
  private prelude: string[] = []
  private errors: YAMLParseError[] = []
  private warnings: YAMLWarning[] = []

  constructor(
    onDocument: Composer['onDocument'],
    options: ParseOptions & DocumentOptions & SchemaOptions = {}
  ) {
    this.directives = new Directives({
      version: options?.version || defaultOptions.version
    })
    this.onDocument = onDocument
    this.options = options
  }

  private onError = (
    offset: number,
    code: ErrorCode,
    message: string,
    warning?: boolean
  ) => {
    if (warning) this.warnings.push(new YAMLWarning(offset, code, message))
    else this.errors.push(new YAMLParseError(offset, code, message))
  }

  private decorate(doc: Document.Parsed, afterDoc: boolean) {
    const { comment, afterEmptyLine } = parsePrelude(this.prelude)
    //console.log({ dc: doc.comment, prelude, comment })
    if (comment) {
      const dc = doc.contents
      if (afterDoc) {
        doc.comment = doc.comment ? `${doc.comment}\n${comment}` : comment
      } else if (afterEmptyLine || doc.directives.marker || !dc) {
        doc.commentBefore = comment
      } else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
        const it = dc.items[0]
        const cb = it.commentBefore
        it.commentBefore = cb ? `${comment}\n${cb}` : comment
      } else {
        const cb = dc.commentBefore
        dc.commentBefore = cb ? `${comment}\n${cb}` : comment
      }
    }

    if (afterDoc) {
      Array.prototype.push.apply(doc.errors, this.errors)
      Array.prototype.push.apply(doc.warnings, this.warnings)
    } else {
      doc.errors = this.errors
      doc.warnings = this.warnings
    }

    this.prelude = []
    this.errors = []
    this.warnings = []
  }

  /**
   * Current stream status information.
   *
   * Mostly useful at the end of input for an empty stream.
   */
  streamInfo() {
    return {
      comment: parsePrelude(this.prelude).comment,
      directives: this.directives,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  /**
   * Advance the composed by one CST token. Bound to the Composer
   * instance, so may be used directly as a callback function.
   */
  next = (token: Token) => {
    if (process.env.LOG_STREAM) console.dir(token, { depth: null })
    switch (token.type) {
      case 'directive':
        this.directives.add(token.source, (offset, message, warning) =>
          this.onError(offset, 'BAD_DIRECTIVE', message, warning)
        )
        this.prelude.push(token.source)
        this.atDirectives = true
        break
      case 'document': {
        const doc = composeDoc(
          this.options,
          this.directives,
          token,
          this.onError
        )
        this.decorate(doc, false)
        if (this.doc) this.onDocument(this.doc)
        this.doc = doc
        this.atDirectives = false
        break
      }
      case 'byte-order-mark':
      case 'space':
        break
      case 'comment':
      case 'newline':
        this.prelude.push(token.source)
        break
      case 'error': {
        const msg = token.source
          ? `${token.message}: ${JSON.stringify(token.source)}`
          : token.message
        const error = new YAMLParseError(-1, 'UNEXPECTED_TOKEN', msg)
        if (this.atDirectives || !this.doc) this.errors.push(error)
        else this.doc.errors.push(error)
        break
      }
      case 'doc-end': {
        if (!this.doc) {
          const msg = 'Unexpected doc-end without preceding document'
          this.errors.push(
            new YAMLParseError(token.offset, 'UNEXPECTED_TOKEN', msg)
          )
          break
        }
        const end = resolveEnd(
          token.end,
          token.offset + token.source.length,
          this.doc.options.strict,
          this.onError
        )
        this.decorate(this.doc, true)
        if (end.comment) {
          const dc = this.doc.comment
          this.doc.comment = dc ? `${dc}\n${end.comment}` : end.comment
        }
        this.doc.range[1] = end.offset
        break
      }
      default:
        this.errors.push(
          new YAMLParseError(
            -1,
            'UNEXPECTED_TOKEN',
            `Unsupported token ${token.type}`
          )
        )
    }
  }

  /** Call at end of input to push out any remaining document. */
  end(): void

  /**
   * Call at end of input to push out any remaining document.
   *
   * @param forceDoc - If the stream contains no document, still emit a final
   *   document including any comments and directives that would be applied
   *   to a subsequent document.
   * @param offset - Should be set if `forceDoc` is also set, to set the
   *   document range end and to indicate errors correctly.
   */
  end(forceDoc: true, offset: number): void

  end(forceDoc = false, offset = -1) {
    if (this.doc) {
      this.decorate(this.doc, true)
      this.onDocument(this.doc)
      this.doc = null
    } else if (forceDoc) {
      const opts = Object.assign({ directives: this.directives }, this.options)
      const doc = new Document(undefined, opts) as Document.Parsed
      if (this.atDirectives)
        this.onError(
          offset,
          'MISSING_CHAR',
          'Missing directives-end indicator line'
        )
      doc.range = [0, offset]
      this.decorate(doc, false)
      this.onDocument(doc)
    }
  }
}
