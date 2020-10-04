import { SourceToken } from '../parse/parser'

export interface Props {
  found: boolean
  spaceBefore: boolean
  comment: string
  anchor: string
  tagName: string
  length: number
}

export function resolveProps(
  start: SourceToken[],
  indicator: 'explicit-key-ind' | 'map-value-ind' | 'seq-item-ind',
  onError: (relOffset: number, message: string) => void
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
        anchor = token.source.substring(1)
        break
      case 'tag':
        tagName = token.source // FIXME
        break
      case indicator:
        // Could here handle preceding comments differently
        found = true
        break
      default:
        onError(length, `Unexpected ${token.type} token`)
    }
    if (token.source) length += token.source.length
  }
  if (!comment && sep) spaceBefore = true
  return { found, spaceBefore, comment, anchor, tagName, length }
}
