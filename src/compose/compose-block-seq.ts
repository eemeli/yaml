import { YAMLSeq } from '../ast/index.js'
import type { Document } from '../doc/Document.js'
import type { BlockSequence } from '../parse/parser.js'
import { composeNode } from './compose-node.js'
import { resolveProps } from './resolve-props.js'

export function composeBlockSeq(
  doc: Document.Parsed,
  { items, offset }: BlockSequence,
  anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const start = offset
  const seq = new YAMLSeq(doc.schema)
  if (anchor) doc.anchors.setAnchor(seq, anchor)
  for (const { start, value } of items) {
    const props = resolveProps(start, 'seq-item-ind', offset, onError)
    offset += props.length
    if (!props.found) {
      if (props.anchor || props.tagName || value) {
        onError(offset, 'Sequence item without - indicator')
      } else {
        // TODO: assert being at last item?
        if (props.comment) seq.comment = props.comment
        continue
      }
    }
    const token = value || { type: 'scalar', offset, indent: -1, source: '' }
    const node = composeNode(doc, token, props, onError)
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
