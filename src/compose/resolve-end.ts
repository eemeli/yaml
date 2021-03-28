import type { SourceToken } from '../parse/tokens.js'
import type { ComposeErrorHandler } from './composer.js'

export function resolveEnd(
  end: SourceToken[] | undefined,
  offset: number,
  reqSpace: boolean,
  onError: ComposeErrorHandler
) {
  let comment = ''
  if (end) {
    let hasSpace = false
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
          if (!comment) comment = cb
          else comment += sep + cb
          sep = ''
          break
        }
        case 'newline':
          if (comment) sep += source
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
