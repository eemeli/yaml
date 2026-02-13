import type { Document, DocValue } from '../doc/Document.ts'
import type { ToStringOptions } from '../options.ts'
import {
  createStringifyContext,
  stringify,
  type StringifyContext
} from './stringify.ts'
import { indentComment, lineComment } from './stringifyComment.ts'

export function stringifyDocument(
  doc: Readonly<Document<DocValue, boolean>>,
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
  if (doc.value.spaceBefore && hasDirectives) lines.push('')
  if (doc.value.commentBefore) {
    const cs = commentString(doc.value.commentBefore)
    lines.push(indentComment(cs, ''))
  }
  // top-level block scalars need to be indented if followed by a comment
  ctx.forceBlockIndent = !!doc.comment
  contentComment = doc.value.comment
  const onChompKeep = contentComment ? undefined : () => (chompKeep = true)
  let body = stringify(
    doc.value,
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
