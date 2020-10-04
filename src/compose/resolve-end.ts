import { SourceToken } from '../parse/parser.js'

export function resolveEnd(end: SourceToken[] | undefined) {
  let comment = ''
  let length = 0
  if (end) {
    let hasComment = false
    let sep = ''
    for (const token of end) {
      if (token.type === 'comment') {
        const cb = token.source.substring(1)
        if (!hasComment) comment = cb
        else comment += sep + cb
        hasComment = true
        sep = ''
      } else if (hasComment && token.type === 'newline') sep += token.source
      length += token.source.length
    }
  }
  return { comment, length }
}
