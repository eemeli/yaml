import { Directives } from '../doc/directives.js'
import { Document } from '../doc/Document.js'
import { YAMLParseError, YAMLWarning } from '../errors.js'
import { defaultOptions, Options } from '../options.js'
import { Parser } from '../parse/parser.js'
import { composeDoc } from './compose-doc.js'
import { resolveEnd } from './resolve-end.js'

export function parseDocs(source: string, options?: Options) {
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
          console.log('###', token)
      }
    },
    n => lines.push(n)
  )
  parser.parse(source)

  return docs
}
