import type { ErrorCode } from '../errors.js'
import type { SourceToken } from '../parse/tokens.js'

export function resolveEnd(
  end: SourceToken[] | undefined,
  offset: number,
  reqSpace: boolean,
  onError: (offset: number, code: ErrorCode, message: string) => void
) {
  let comment = ''
  if (end) {
    let hasSpace = false
    let hasComment = false
    let sep = ''
    for (const { source, type } of end) {
      switch (type) {
        case 'space':
          hasSpace = true
          break
        case 'comment': {
          if (reqSpace && !hasSpace)
            onError(
              offset,
              'COMMENT_SPACE',
              'Comments must be separated from other tokens by white space characters'
            )
          const cb = source.substring(1)
          if (!hasComment) comment = cb
          else comment += sep + cb
          hasComment = true
          sep = ''
          break
        }
        case 'newline':
          if (hasComment) sep += source
          hasSpace = true
          break
        default:
          onError(offset, 'UNEXPECTED_TOKEN', `Unexpected ${type} at node end`)
      }
      offset += source.length
    }
  }
  return { comment, offset }
}
