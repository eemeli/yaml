import type { Document } from '../doc/Document.ts'
import { NodeBase, type Node } from '../nodes/Node.ts'
import type { ToStringOptions } from '../options.ts'
import {
  createStringifyContext,
  stringify,
  type StringifyContext
} from './stringify.ts'
import { indentComment, lineComment } from './stringifyComment.ts'

export function stringifyDocument(
  doc: Readonly<Document<Node, boolean>>,
  options: ToStringOptions
): string {
  const lines: string[] = []
  let hasDirectives = options.directives === true
  if (options.directives !== false && doc.directives) {
    const dir = doc.directives.toString(doc)
    if (dir) {
      lines.push(dir)
      hasDirectives = true
    } else if (doc.directives.docStart) hasDirectives = true
  }
  if (hasDirectives) lines.push('---')

  const ctx: StringifyContext = createStringifyContext(doc, options)
  const { commentString } = ctx.options

  if (doc.commentBefore) {
    if (lines.length !== 1) lines.unshift('')
    const cs = commentString(doc.commentBefore)
    lines.unshift(indentComment(cs, ''))
  }

  let chompKeep = false
  let contentComment = null
  if (doc.contents) {
    if (doc.contents instanceof NodeBase) {
      if (doc.contents.spaceBefore && hasDirectives) lines.push('')
      if (doc.contents.commentBefore) {
        const cs = commentString(doc.contents.commentBefore)
        lines.push(indentComment(cs, ''))
      }
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
    if (contentComment)
      body += lineComment(body, '', commentString(contentComment))
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
  if (doc.directives?.docEnd) {
    if (doc.comment) {
      const cs = commentString(doc.comment)
      if (cs.includes('\n')) {
        lines.push('...')
        lines.push(indentComment(cs, ''))
      } else {
        lines.push(`... ${cs}`)
      }
    } else {
      lines.push('...')
    }
  } else {
    let dc = doc.comment
    if (dc && chompKeep) dc = dc.replace(/^\n+/, '')
    if (dc) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '')
        lines.push('')
      lines.push(indentComment(commentString(dc), ''))
    }
  }
  return lines.join('\n') + '\n'
}
