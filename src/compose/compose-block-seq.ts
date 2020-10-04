import { YAMLSeq } from '../ast/index.js'
import type { Document } from '../doc/Document.js'
import type { BlockSequence } from '../parse/parser.js'
import { composeNode } from './compose-node.js'

export function composeBlockSeq(
  doc: Document.Parsed,
  { items, offset }: BlockSequence,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const start = offset
  const seq = new YAMLSeq(doc.schema)
  for (const { start, value } of items) {
    let spaceBefore = false
    let comment = ''
    let hasComment = false
    let sep = ''
    let anchor = ''
    let tagName = ''
    let hasSeparator = false
    for (const token of start) {
      switch (token.type) {
        case 'space':
          break
        case 'comment': {
          const cb = token.source.substring(1)
          if (!hasComment) {
            if (sep) spaceBefore = true
            comment = cb
          } else comment += sep + cb
          hasComment = true
          sep = ''
          break
        }
        case 'newline':
          sep += token.source
          break
        case 'anchor':
          anchor = token.source.substring(1)
          break
        case 'tag':
          tagName = token.source // FIXME
          break
        case 'seq-item-ind':
          // Could here handle preceding comments differently
          hasSeparator = true
          break
        default:
          onError(
            offset,
            `Unexpected token before sequence item: ${token.type}`
          )
      }
      if (token.source) offset += token.source.length
    }
    if (!hasSeparator) {
      if (anchor || tagName || value) {
        onError(offset, 'Sequence item without - indicator')
      } else {
        // TODO: assert being at last item?
        if (comment) seq.comment = comment
        continue
      }
    }
    // FIXME: recursive anchors
    const node = composeNode(doc, value || null, tagName, onError)
    if (comment) {
      if (spaceBefore) node.spaceBefore = true
      if (value) node.commentBefore = comment
      else node.comment = comment
    } else if (sep) node.spaceBefore = true
    if (anchor) doc.anchors.setAnchor(node, anchor)
    if (node.range) offset = node.range[1]
    else {
      // FIXME: remove once verified never happens
      onError(offset, 'Resolved child node has no range')
      if (value) {
        if ('offset' in value) offset = value.offset
        if ('source' in value && value.source) offset += value.source.length
      }
    }
    seq.items.push(node)
  }
  seq.range = [start, offset]
  return seq
}
