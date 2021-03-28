import type { ErrorCode } from '../errors.js'
import { YAMLSeq } from '../nodes/YAMLSeq.js'
import type { BlockSequence } from '../parse/tokens.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import { resolveProps } from './resolve-props.js'

export function resolveBlockSeq(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  bs: BlockSequence,
  onError: (
    offset: number,
    code: ErrorCode,
    message: string,
    warning?: boolean
  ) => void
) {
  const seq = new YAMLSeq(ctx.schema)
  let offset = bs.offset
  for (const { start, value } of bs.items) {
    const props = resolveProps(
      ctx,
      start,
      true,
      'seq-item-ind',
      offset,
      onError
    )
    offset = props.end
    if (!props.found) {
      if (props.anchor || props.tagName || value) {
        if (value && value.type === 'block-seq')
          onError(
            offset,
            'BAD_INDENT',
            'All sequence items must start at the same column'
          )
        else
          onError(offset, 'MISSING_CHAR', 'Sequence item without - indicator')
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
  seq.range = [bs.offset, offset]
  return seq as YAMLSeq.Parsed
}
