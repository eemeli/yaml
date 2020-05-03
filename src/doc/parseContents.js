import { Collection } from '../ast'
import { Type } from '../constants'
import { YAMLSyntaxError } from '../errors'
import { resolveNode } from './resolveNode'

export function parseContents(doc, contents) {
  const comments = { before: [], after: [] }
  const contentNodes = []
  let spaceBefore = false
  for (const node of contents) {
    if (node.valueRange) {
      if (contentNodes.length === 1) {
        const msg = 'Document is not valid YAML (bad indentation?)'
        doc.errors.push(new YAMLSyntaxError(node, msg))
      }
      const res = resolveNode(doc, node)
      if (spaceBefore) {
        res.spaceBefore = true
        spaceBefore = false
      }
      contentNodes.push(res)
    } else if (node.comment !== null) {
      const cc = contentNodes.length === 0 ? comments.before : comments.after
      cc.push(node.comment)
    } else if (node.type === Type.BLANK_LINE) {
      spaceBefore = true
      if (
        contentNodes.length === 0 &&
        comments.before.length > 0 &&
        !doc.commentBefore
      ) {
        // space-separated comments at start are parsed as document comments
        doc.commentBefore = comments.before.join('\n')
        comments.before = []
      }
    }
  }

  switch (contentNodes.length) {
    // empty document
    case 0:
      doc.contents = null
      comments.after = comments.before
      break

    case 1:
      doc.contents = contentNodes[0]
      if (doc.contents) {
        const cb = comments.before.join('\n') || null
        if (cb) {
          const cbNode =
            doc.contents instanceof Collection && doc.contents.items[0]
              ? doc.contents.items[0]
              : doc.contents
          cbNode.commentBefore = cbNode.commentBefore
            ? `${cb}\n${cbNode.commentBefore}`
            : cb
        }
      } else {
        comments.after = comments.before.concat(comments.after)
      }
      break

    // invalid source
    default:
      doc.contents = contentNodes
      if (doc.contents[0]) {
        doc.contents[0].commentBefore = comments.before.join('\n') || null
      } else {
        comments.after = comments.before.concat(comments.after)
      }
  }
  doc.comment = comments.after.join('\n') || null
}
