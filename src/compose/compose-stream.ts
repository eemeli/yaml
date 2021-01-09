import { Directives } from '../doc/directives.js'
import { Document } from '../doc/Document.js'
import { YAMLParseError, YAMLWarning } from '../errors.js'
import { defaultOptions, Options } from '../options.js'
import { Parser } from '../parse/parser.js'
import { composeDoc } from './compose-doc.js'
import { resolveEnd } from './resolve-end.js'

export interface EmptyStream extends Array<Document.Parsed> {
  empty: true
  comment: string
  errors: YAMLParseError[]
  warnings: YAMLWarning[]
}

/**
 * @returns If an empty `docs` array is returned, it will be of type
 *   EmptyStream. In TypeScript, you may use `'empty' in docs` as a
 *   type guard for it, as `docs.length === 0` won't catch it.
 */
export function composeStream(
  source: string,
  forceDoc: boolean,
  options?: Options
) {
  const directives = new Directives({
    version: options?.version || defaultOptions.version || '1.2'
  })
  const docs: Document.Parsed[] = []
  const lines: number[] = []

  let atDirectives = false
  let comment = ''
  let errors: YAMLParseError[] = []
  let warnings: YAMLWarning[] = []
  const onError = (offset: number, message: string, warning?: boolean) => {
    warning
      ? warnings.push(new YAMLWarning(offset, message))
      : errors.push(new YAMLParseError(offset, message))
  }
  const decorate = (doc: Document.Parsed) => {
    if (comment) doc.commentBefore = comment.trimRight()
    comment = ''

    doc.errors = errors
    errors = []

    doc.warnings = warnings
    warnings = []
  }

  const parser = new Parser(
    token => {
      if (process.env.LOG_STREAM) console.dir(token, { depth: null })
      switch (token.type) {
        case 'directive':
          directives.add(token.source, onError)
          atDirectives = true
          break
        case 'document': {
          const doc = composeDoc(options, directives, token, onError)
          decorate(doc)
          docs.push(doc)
          atDirectives = false
          break
        }
        case 'byte-order-mark':
        case 'space':
          break
        case 'comment':
          comment += token.source.substring(1)
          break
        case 'newline':
          if (comment) comment += token.source
          break
        case 'error': {
          const msg = token.source
            ? `${token.message}: ${JSON.stringify(token.source)}`
            : token.message
          const error = new YAMLParseError(-1, msg)
          if (atDirectives || docs.length === 0) errors.push(error)
          else docs[docs.length - 1].errors.push(error)
          break
        }
        case 'doc-end': {
          const doc = docs[docs.length - 1]
          if (!doc) {
            const msg = 'Unexpected doc-end without preceding document'
            errors.push(new YAMLParseError(token.offset, msg))
            break
          }
          const end = resolveEnd(
            token.end,
            token.offset + token.source.length,
            doc.options.strict,
            onError
          )
          if (end.comment) {
            if (doc.comment) doc.comment += `\n${end.comment}`
            else doc.comment = end.comment
          }
          if (errors.length > 0) {
            Array.prototype.push.apply(doc.errors, errors)
            errors = []
          }
          break
        }
        default:
          errors.push(new YAMLParseError(-1, `Unsupported token ${token.type}`))
      }
    },
    n => lines.push(n)
  )
  parser.parse(source)

  if (docs.length === 0) {
    if (forceDoc) {
      const doc = new Document(undefined, options) as Document.Parsed
      doc.directives = directives.atDocument()
      if (atDirectives) {
        const errMsg = 'Missing directives-end indicator line'
        doc.errors.push(new YAMLParseError(source.length, errMsg))
      }
      doc.setSchema() // FIXME: always do this in the constructor
      doc.range = [0, source.length]
      docs.push(doc)
    } else {
      const empty: EmptyStream = Object.assign(
        [],
        { empty: true } as { empty: true },
        { comment: comment.trimRight(), errors, warnings }
      )
      return empty
    }
  }

  if (comment || errors.length > 0 || warnings.length > 0) {
    const lastDoc = docs[docs.length - 1]
    comment = comment.trimRight()
    if (comment) {
      if (lastDoc.comment) lastDoc.comment += `\n${comment}`
      else lastDoc.comment = comment
    }
    Array.prototype.push.apply(lastDoc.errors, errors)
    Array.prototype.push.apply(lastDoc.warnings, warnings)
  }

  // TS would complain without the cast, but docs is always non-empty here
  return (docs as unknown) as [Document.Parsed, ...Document.Parsed[]]
}
