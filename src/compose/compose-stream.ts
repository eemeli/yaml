import { Directives } from '../doc/directives.js'
import { Document } from '../doc/Document.js'
import { YAMLParseError, YAMLWarning } from '../errors.js'
import { defaultOptions, Options } from '../options.js'
import { Parser } from '../parse/parser.js'
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

export interface EmptyStream extends Array<Document.Parsed> {
  empty: true
  comment: string
  directives: Directives
  errors: YAMLParseError[]
  warnings: YAMLWarning[]
}

/**
 * @returns If an empty `docs` array is returned, it will be of type
 *   EmptyStream. In TypeScript, you should use `'empty' in docs` as
 *   a type guard for it.
 */
export function composeStream(
  source: string,
  forceDoc: boolean,
  options?: Options
): Document.Parsed[] | EmptyStream {
  const directives = new Directives({
    version: options?.version || defaultOptions.version || '1.2'
  })
  const docs: Document.Parsed[] = []
  const lines: number[] = []

  let atDirectives = false
  let prelude: string[] = []
  let errors: YAMLParseError[] = []
  let warnings: YAMLWarning[] = []
  const onError = (offset: number, message: string, warning?: boolean) => {
    warning
      ? warnings.push(new YAMLWarning(offset, message))
      : errors.push(new YAMLParseError(offset, message))
  }

  const decorate = (doc: Document.Parsed, afterDoc: boolean) => {
    const { comment, afterEmptyLine } = parsePrelude(prelude)
    //console.log({ dc: doc.comment, prelude, comment })
    if (comment) {
      if (afterDoc) {
        const dc = doc.comment
        doc.comment = dc ? `${dc}\n${comment}` : comment
      } else if (afterEmptyLine || doc.directivesEndMarker || !doc.contents) {
        doc.commentBefore = comment
      } else {
        const cb = doc.contents.commentBefore
        doc.contents.commentBefore = cb ? `${comment}\n${cb}` : comment
      }
    }

    if (afterDoc) {
      Array.prototype.push.apply(doc.errors, errors)
      Array.prototype.push.apply(doc.warnings, warnings)
    } else {
      doc.errors = errors
      doc.warnings = warnings
    }

    prelude = []
    errors = []
    warnings = []
  }

  const parser = new Parser(
    token => {
      if (process.env.LOG_STREAM) console.dir(token, { depth: null })
      switch (token.type) {
        case 'directive':
          directives.add(token.source, onError)
          prelude.push(token.source)
          atDirectives = true
          break
        case 'document': {
          const doc = composeDoc(options, directives, token, onError)
          decorate(doc, false)
          docs.push(doc)
          atDirectives = false
          break
        }
        case 'byte-order-mark':
        case 'space':
          break
        case 'comment':
        case 'newline':
          prelude.push(token.source)
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
          decorate(doc, true)
          if (end.comment) {
            const dc = doc.comment
            doc.comment = dc ? `${dc}\n${end.comment}` : end.comment
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
      if (atDirectives)
        onError(source.length, 'Missing directives-end indicator line')
      doc.setSchema() // FIXME: always do this in the constructor
      doc.range = [0, source.length]
      decorate(doc, false)
      return [doc]
    } else {
      const { comment } = parsePrelude(prelude)
      const empty: EmptyStream = Object.assign(
        [],
        { empty: true } as { empty: true },
        { comment, directives, errors, warnings }
      )
      return empty
    }
  }

  decorate(docs[docs.length - 1], true)
  return docs
}
