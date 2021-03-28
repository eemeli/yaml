import type { SourceToken } from '../parse/tokens.js'
import type { ComposeContext } from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'

export function resolveProps(
  ctx: ComposeContext,
  tokens: SourceToken[],
  startOnNewline: boolean,
  indicator:
    | 'doc-start'
    | 'explicit-key-ind'
    | 'map-value-ind'
    | 'seq-item-ind',
  offset: number,
  onError: ComposeErrorHandler
) {
  let spaceBefore = false
  let atNewline = startOnNewline
  let hasSpace = startOnNewline
  let comment = ''
  let commentSep = ''
  let hasNewline = false
  let anchor = ''
  let tagName = ''
  let found: SourceToken | null = null
  let start: number | null = null
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
        // At the doc level, tabs at line start may be parsed as leading
        // white space rather than indentation.
        if (atNewline && indicator !== 'doc-start' && token.source[0] === '\t')
          onError(
            token.offset,
            'TAB_AS_INDENT',
            'Tabs are not allowed as indentation'
          )
        hasSpace = true
        break
      case 'comment': {
        if (ctx.options.strict && !hasSpace)
          onError(
            token.offset,
            'COMMENT_SPACE',
            'Comments must be separated from other tokens by white space characters'
          )
        const cb = token.source.substring(1)
        if (!comment) comment = cb
        else comment += commentSep + cb
        commentSep = ''
        break
      }
      case 'newline':
        if (atNewline && !comment) spaceBefore = true
        atNewline = true
        hasNewline = true
        hasSpace = true
        commentSep += token.source
        break
      case 'anchor':
        if (anchor)
          onError(
            token.offset,
            'MULTIPLE_ANCHORS',
            'A node can have at most one anchor'
          )
        anchor = token.source.substring(1)
        if (start === null) start = token.offset
        atNewline = false
        hasSpace = false
        break
      case 'tag': {
        if (tagName)
          onError(
            token.offset,
            'MULTIPLE_TAGS',
            'A node can have at most one tag'
          )
        const tn = ctx.directives.tagName(token.source, msg =>
          onError(token.offset, 'TAG_RESOLVE_FAILED', msg)
        )
        if (tn) tagName = tn
        if (start === null) start = token.offset
        atNewline = false
        hasSpace = false
        break
      }
      case indicator:
        // Could here handle preceding comments differently
        found = token
        atNewline = false
        hasSpace = false
        break
      default:
        onError(
          token.offset,
          'UNEXPECTED_TOKEN',
          `Unexpected ${token.type} token`
        )
        atNewline = false
        hasSpace = false
    }
  }
  const last = tokens[tokens.length - 1]
  const end = last ? last.offset + last.source.length : offset
  return {
    found,
    spaceBefore,
    comment,
    hasNewline,
    anchor,
    tagName,
    end,
    start: start ?? end
  }
}
