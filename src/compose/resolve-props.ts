import type { SourceToken } from '../parse/cst.js'
import type { ComposeContext } from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'

export interface ResolvePropsArg {
  ctx: ComposeContext
  flow?: string
  indicator: 'doc-start' | 'explicit-key-ind' | 'map-value-ind' | 'seq-item-ind'
  offset: number
  onError: ComposeErrorHandler
  startOnNewline: boolean
}

export function resolveProps(
  tokens: SourceToken[],
  { ctx, flow, indicator, offset, onError, startOnNewline }: ResolvePropsArg
) {
  let spaceBefore = false
  let atNewline = startOnNewline
  let hasSpace = startOnNewline
  let comment = ''
  let commentSep = ''
  let hasNewline = false
  let anchor: SourceToken | null = null
  let tag: SourceToken | null = null
  let comma: SourceToken | null = null
  let found: SourceToken | null = null
  let start: number | null = null
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
        // At the doc level, tabs at line start may be parsed
        // as leading white space rather than indentation.
        // In a flow collection, only the parser handles indent.
        if (
          !flow &&
          atNewline &&
          indicator !== 'doc-start' &&
          token.source[0] === '\t'
        )
          onError(token, 'TAB_AS_INDENT', 'Tabs are not allowed as indentation')
        hasSpace = true
        break
      case 'comment': {
        if (ctx.options.strict && !hasSpace)
          onError(
            token,
            'COMMENT_SPACE',
            'Comments must be separated from other tokens by white space characters'
          )
        const cb = token.source.substring(1) || ' '
        if (!comment) comment = cb
        else comment += commentSep + cb
        commentSep = ''
        atNewline = false
        break
      }
      case 'newline':
        if (atNewline) {
          if (comment) comment += token.source
          else spaceBefore = true
        } else commentSep += token.source
        atNewline = true
        hasNewline = true
        hasSpace = true
        break
      case 'anchor':
        if (anchor)
          onError(
            token,
            'MULTIPLE_ANCHORS',
            'A node can have at most one anchor'
          )
        anchor = token
        if (start === null) start = token.offset
        atNewline = false
        hasSpace = false
        break
      case 'tag': {
        if (tag)
          onError(token, 'MULTIPLE_TAGS', 'A node can have at most one tag')
        tag = token
        if (start === null) start = token.offset
        atNewline = false
        hasSpace = false
        break
      }
      case indicator:
        // Could here handle preceding comments differently
        if (anchor || tag)
          onError(
            token,
            'BAD_PROP_ORDER',
            `Anchors and tags must be after the ${token.source} indicator`
          )
        found = token
        atNewline = false
        hasSpace = false
        break
      case 'comma':
        if (flow) {
          if (comma)
            onError(token, 'UNEXPECTED_TOKEN', `Unexpected , in ${flow}`)
          comma = token
          atNewline = false
          hasSpace = false
          break
        }
      // else fallthrough
      default:
        onError(token, 'UNEXPECTED_TOKEN', `Unexpected ${token.type} token`)
        atNewline = false
        hasSpace = false
    }
  }
  const last = tokens[tokens.length - 1]
  const end = last ? last.offset + last.source.length : offset
  return {
    comma,
    found,
    spaceBefore,
    comment,
    hasNewline,
    anchor,
    tag,
    end,
    start: start ?? end
  }
}
