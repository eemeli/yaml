import { YAMLSeq } from '../ast/index.js'
import { Type } from '../constants.js'
import type { Document } from '../doc/Document.js'
import type { BlockSequence } from '../parse/tokens.js'
import { composeNode } from './compose-node.js'
import { resolveProps } from './resolve-props.js'

export function resolveBlockSeq(
  doc: Document.Parsed,
  { items, offset }: BlockSequence,
  anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const start = offset
  const seq = new YAMLSeq(doc.schema)
  seq.type = Type.SEQ
  if (anchor) doc.anchors.setAnchor(seq, anchor)
  loop: for (const { start, value } of items) {
    const props = resolveProps(
      doc,
      start,
      true,
      'seq-item-ind',
      offset,
      onError
    )
    offset += props.length
    if (props.found === -1) {
      if (props.anchor || props.tagName || value) {
        const msg =
          value && value.type === 'block-seq'
            ? 'All sequence items must start at the same column'
            : 'Sequence item without - indicator'
        onError(offset, msg)
      } else {
        // TODO: assert being at last item?
        if (props.comment) seq.comment = props.comment
        continue
      }
    }
    const node = composeNode(doc, value || offset, props, onError)
    offset = node.range[1]
    seq.items.push(node)
  }
  seq.range = [start, offset]
  return seq as YAMLSeq.Parsed
}
