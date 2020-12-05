import { SourceToken } from '../parse/parser'

export function resolveProps(
  start: SourceToken[],
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
  let comment = ''
  let hasComment = false
  let sep = ''
  let anchor = ''
  let tagName = ''
  let found = false
  for (const token of start) {
    switch (token.type) {
      case 'space':
        break
      case 'comment': {
        const cb = token.source.substring(1)
        if (!hasComment) {
          if (sep) spaceBefore = true
          comment = cb
        } else comment += sep + cb
        hasComment = true
        sep = ''
        break
      }
      case 'newline':
        sep += token.source
        break
      case 'anchor':
        if (anchor)
          onError(offset + length, 'A node can have at most one anchor')
        anchor = token.source.substring(1)
        break
      case 'tag':
        if (tagName) onError(offset + length, 'A node can have at most one tag')
        tagName = token.source // FIXME
        break
      case indicator:
        // Could here handle preceding comments differently
        found = true
        break
      default:
        onError(offset + length, `Unexpected ${token.type} token`)
    }
    if (token.source) length += token.source.length
  }
  if (!comment && sep) spaceBefore = true
  return { found, spaceBefore, comment, anchor, tagName, length }
}
