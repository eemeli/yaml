import { Document } from '../doc/Document.js'
import { StreamDirectives } from '../doc/stream-directives.js'
import { YAMLParseError, YAMLWarning } from '../errors.js'
import type { Options } from '../options.js'
import { Parser } from '../parse/parser.js'
import { composeDoc } from './compose-doc.js'

export function parseDocs(source: string, options?: Options) {
  const directives = new StreamDirectives()
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
        case 'space':
        case 'doc-end':
          break
        default:
          console.log('###', token)
      }
    },
    n => lines.push(n)
  )
  parser.parse(source)

  return docs
}
