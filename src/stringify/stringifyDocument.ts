import { Document } from '../doc/Document.js'
import { isNode } from '../nodes/Node.js'
import { ToStringOptions } from '../options.js'
import {
  createStringifyContext,
  stringify,
  StringifyContext
} from './stringify.js'
import { addComment, stringifyComment } from './stringifyComment.js'

export function stringifyDocument(
  doc: Readonly<Document>,
  options: ToStringOptions
) {
  const lines = []
  let hasDirectives = options.directives === true
  if (options.directives !== false) {
    const dir = doc.directives.toString(doc)
    if (dir) {
      lines.push(dir)
      hasDirectives = true
    } else if (doc.directives.marker) hasDirectives = true
  }
  if (hasDirectives) lines.push('---')
  if (doc.commentBefore) {
    if (lines.length !== 1) lines.unshift('')
    lines.unshift(stringifyComment(doc.commentBefore, ''))
  }

  const ctx: StringifyContext = createStringifyContext(doc, options)
  let chompKeep = false
  let contentComment = null
  if (doc.contents) {
    if (isNode(doc.contents)) {
      if (doc.contents.spaceBefore && hasDirectives) lines.push('')
      if (doc.contents.commentBefore)
        lines.push(stringifyComment(doc.contents.commentBefore, ''))
      // top-level block scalars need to be indented if followed by a comment
      ctx.forceBlockIndent = !!doc.comment
      contentComment = doc.contents.comment
    }
    const onChompKeep = contentComment ? undefined : () => (chompKeep = true)
    let body = stringify(
      doc.contents,
      ctx,
      () => (contentComment = null),
      onChompKeep
    )
    if (contentComment) body = addComment(body, '', contentComment)
    if (
      (body[0] === '|' || body[0] === '>') &&
      lines[lines.length - 1] === '---'
    ) {
      // Top-level block scalars with a preceding doc marker ought to use the
      // same line for their header.
      lines[lines.length - 1] = `--- ${body}`
    } else lines.push(body)
  } else {
    lines.push(stringify(doc.contents, ctx))
  }
  if (doc.comment) {
    if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '')
      lines.push('')
    lines.push(stringifyComment(doc.comment, ''))
  }
  return lines.join('\n') + '\n'
}
