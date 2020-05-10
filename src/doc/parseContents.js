import { Collection } from '../ast/index.js'
import { Type } from '../constants.js'
import { YAMLSyntaxError } from '../errors.js'
import { resolveNode } from '../resolve/resolveNode.js'

export function parseContents(doc, contents) {
  const comments = { before: [], after: [] }
  let body = undefined
  let spaceBefore = false
  for (const node of contents) {
    if (node.valueRange) {
      if (body !== undefined) {
        const msg =
          'Document contains trailing content not separated by a ... or --- line'
        doc.errors.push(new YAMLSyntaxError(node, msg))
        break
      }
      const res = resolveNode(doc, node)
      if (spaceBefore) {
        res.spaceBefore = true
        spaceBefore = false
      }
      body = res
    } else if (node.comment !== null) {
      const cc = body === undefined ? comments.before : comments.after
      cc.push(node.comment)
    } else if (node.type === Type.BLANK_LINE) {
      spaceBefore = true
      if (
        body === undefined &&
        comments.before.length > 0 &&
        !doc.commentBefore
      ) {
        // space-separated comments at start are parsed as document comments
        doc.commentBefore = comments.before.join('\n')
        comments.before = []
      }
    }
  }

  doc.contents = body || null
  if (!body) {
    doc.comment = comments.before.concat(comments.after).join('\n') || null
  } else {
    const cb = comments.before.join('\n')
    if (cb) {
      const cbNode =
        body instanceof Collection && body.items[0] ? body.items[0] : body
      cbNode.commentBefore = cbNode.commentBefore
        ? `${cb}\n${cbNode.commentBefore}`
        : cb
    }
    doc.comment = comments.after.join('\n') || null
  }
}
