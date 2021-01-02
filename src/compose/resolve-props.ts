import type { Document } from '../doc/Document.js'
import { SourceToken } from '../parse/parser.js'

function isSpaceBefore(sep: string) {
  if (!sep) return false
  const first = sep.indexOf('\n')
  if (first === -1) return false
  return sep.includes('\n', first + 1)
}

export function resolveProps(
  doc: Document.Parsed,
  tokens: SourceToken[],
  startOnNewline: boolean,
  indicator:
    | 'doc-start'
    | 'explicit-key-ind'
    | 'map-value-ind'
    | 'seq-item-ind',
  offset: number,
  onError: (offset: number, message: string) => void
) {
  let length = 0
  let spaceBefore = false
  let hasSpace = startOnNewline
  let comment = ''
  let hasComment = false
  let hasNewline = false
  let sep = ''
  let anchor = ''
  let tagName = ''
  let found = -1
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
        hasSpace = true
        break
      case 'comment': {
        if (doc.options.strict && !hasSpace)
          onError(
            offset + length,
            'Comments must be separated from other tokens by white space characters'
          )
        const cb = token.source.substring(1)
        if (!hasComment) {
          if (isSpaceBefore(sep)) spaceBefore = true
          comment = cb
        } else comment += sep + cb
        hasComment = true
        sep = ''
        break
      }
      case 'newline':
        hasNewline = true
        hasSpace = true
        sep += token.source
        break
      case 'anchor':
        if (anchor)
          onError(offset + length, 'A node can have at most one anchor')
        anchor = token.source.substring(1)
        hasSpace = false
        break
      case 'tag': {
        if (tagName) onError(offset + length, 'A node can have at most one tag')
        const tn = doc.directives.tagName(token.source, msg =>
          onError(offset, msg)
        )
        if (tn) tagName = tn
        hasSpace = false
        break
      }
      case indicator:
        // Could here handle preceding comments differently
        found = token.indent
        hasSpace = false
        break
      default:
        onError(offset + length, `Unexpected ${token.type} token`)
        hasSpace = false
    }
    if (token.source) length += token.source.length
  }
  if (!comment && isSpaceBefore(sep)) spaceBefore = true
  return { found, spaceBefore, comment, hasNewline, anchor, tagName, length }
}
