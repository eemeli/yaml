import { YAMLSeq } from '../nodes/YAMLSeq.js'
import type { BlockSequence } from '../parse/cst.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveProps } from './resolve-props.js'
import { flowIndentCheck } from './util-flow-indent-check.js'

export function resolveBlockSeq(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  bs: BlockSequence,
  onError: ComposeErrorHandler
) {
  const seq = new YAMLSeq(ctx.schema)
  let offset = bs.offset
  for (const { start, value } of bs.items) {
    const props = resolveProps(start, {
      indicator: 'seq-item-ind',
      next: value,
      offset,
      onError,
      startOnNewline: true
    })
    offset = props.end
    if (!props.found) {
      if (props.anchor || props.tag || value) {
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
    if (ctx.schema.compat) flowIndentCheck(bs.indent, value, onError)
    offset = node.range[2]
    seq.items.push(node)
  }
  seq.range = [bs.offset, offset, offset]
  return seq as YAMLSeq.Parsed
}
