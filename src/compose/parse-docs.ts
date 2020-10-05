import { Document } from '../doc/Document'
import { Parser } from '../parse/parser'
import { composeDoc } from './compose-doc'
import { StreamDirectives } from './stream-directives'

export function parseDocs(source: string) {
  const directives = new StreamDirectives()
  const docs: Document.Parsed[] = []
  const lines: number[] = []

  const onError = (offset: number, message: string, warning?: boolean) => {
    console.error(warning ? '???' : '!!!', { offset, message })
  }

  const parser = new Parser(
    token => {
      switch (token.type) {
        case 'directive':
          directives.add(token.source, onError)
          break
        case 'document':
          docs.push(composeDoc(null, directives, token, onError))
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
