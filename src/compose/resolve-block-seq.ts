import { YAMLSeq } from '../nodes/YAMLSeq.js'
import type { BlockSequence } from '../parse/cst.js'
import { CollectionTag } from '../schema/types.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveProps } from './resolve-props.js'
import { flowIndentCheck } from './util-flow-indent-check.js'

export function resolveBlockSeq(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  bs: BlockSequence,
  onError: ComposeErrorHandler,
  tag?: CollectionTag
) {
  const NodeClass = tag?.nodeClass ?? YAMLSeq
  const seq = new NodeClass(ctx.schema) as YAMLSeq

  if (ctx.atRoot) ctx.atRoot = false
  let offset = bs.offset
  let commentEnd: number | null = null
  for (const { start, value } of bs.items) {
    const props = resolveProps(start, {
      indicator: 'seq-item-ind',
      next: value,
      offset,
      onError,
      startOnNewline: true
    })
    if (!props.found) {
      if (props.anchor || props.tag || value) {
        if (value && value.type === 'block-seq')
          onError(
            props.end,
            'BAD_INDENT',
            'All sequence items must start at the same column'
          )
        else
          onError(offset, 'MISSING_CHAR', 'Sequence item without - indicator')
      } else {
        commentEnd = props.end
        if (props.comment) seq.comment = props.comment
        continue
      }
    }
    const node = value
      ? composeNode(ctx, value, props, onError)
      : composeEmptyNode(ctx, props.end, start, null, props, onError)
    if (ctx.schema.compat) flowIndentCheck(bs.indent, value, onError)
    offset = node.range[2]
    seq.items.push(node)
  }
  seq.range = [bs.offset, offset, commentEnd ?? offset]
  return seq as YAMLSeq.Parsed
}
