import { YAMLSeq } from '../nodes/YAMLSeq.js'
import type { BlockSequence } from '../parse/tokens.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import { resolveProps } from './resolve-props.js'

export function resolveBlockSeq(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  { items, offset }: BlockSequence,
  anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const start = offset
  const seq = new YAMLSeq(ctx.schema)
  if (anchor) ctx.anchors.setAnchor(seq, anchor)
  for (const { start, value } of items) {
    const props = resolveProps(
      ctx,
      start,
      true,
      'seq-item-ind',
      offset,
      onError
    )
    offset += props.length
    if (!props.found) {
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
    const node = value
      ? composeNode(ctx, value, props, onError)
      : composeEmptyNode(ctx, offset, start, null, props, onError)
    offset = node.range[1]
    seq.items.push(node)
  }
  seq.range = [start, offset]
  return seq as YAMLSeq.Parsed
}
