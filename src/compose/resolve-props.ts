import type { Document } from '../doc/Document.js'
import type { SourceToken } from '../parse/tokens.js'

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
  let atNewline = startOnNewline
  let hasSpace = startOnNewline
  let comment = ''
  let hasComment = false
  let hasNewline = false
  let sep = ''
  let anchor = ''
  let tagName = ''
  let found: { indent: number, offset: number} | null = null
  let start: number | null = null
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
        // At the doc level, tabs at line start may be parsed as leading
        // white space rather than indentation.
        if (atNewline && indicator !== 'doc-start' && token.source[0] === '\t')
          onError(offset + length, 'Tabs are not allowed as indentation')
        hasSpace = true
        break
      case 'comment': {
        if (doc.options.strict && !hasSpace)
          onError(
            offset + length,
            'Comments must be separated from other tokens by white space characters'
          )
        const cb = token.source.substring(1)
        if (!hasComment) comment = cb
        else comment += sep + cb
        hasComment = true
        sep = ''
        break
      }
      case 'newline':
        if (atNewline && !hasComment) spaceBefore = true
        atNewline = true
        hasNewline = true
        hasSpace = true
        sep += token.source
        break
      case 'anchor':
        if (anchor)
          onError(offset + length, 'A node can have at most one anchor')
        anchor = token.source.substring(1)
        if (start === null) start = offset + length
        atNewline = false
        hasSpace = false
        break
      case 'tag': {
        if (tagName) onError(offset + length, 'A node can have at most one tag')
        const tn = doc.directives.tagName(token.source, msg =>
          onError(offset, msg)
        )
        if (tn) tagName = tn
        if (start === null) start = offset + length
        atNewline = false
        hasSpace = false
        break
      }
      case indicator:
        // Could here handle preceding comments differently
        found = { indent: token.indent, offset: offset + length }
        atNewline = false
        hasSpace = false
        break
      default:
        onError(offset + length, `Unexpected ${token.type} token`)
        atNewline = false
        hasSpace = false
    }
    /* istanbul ignore else should not happen */
    if (token.source) length += token.source.length
  }
  return {
    found,
    spaceBefore,
    comment,
    hasNewline,
    anchor,
    tagName,
    length,
    start: start ?? offset + length
  }
}
