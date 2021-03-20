import { Pair } from '../nodes/Pair.js'
import { YAMLMap } from '../nodes/YAMLMap.js'
import type { BlockMap } from '../parse/tokens.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import { resolveProps } from './resolve-props.js'
import { containsNewline } from './util-contains-newline.js'

const startColMsg = 'All mapping items must start at the same column'

export function resolveBlockMap(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  { indent, items, offset }: BlockMap,
  anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const start = offset
  const map = new YAMLMap(ctx.schema)
  if (anchor) ctx.anchors.setAnchor(map, anchor)

  for (const { start, key, sep, value } of items) {
    // key properties
    const keyProps = resolveProps(
      ctx,
      start,
      true,
      'explicit-key-ind',
      offset,
      onError
    )
    const implicitKey = !keyProps.found
    if (implicitKey) {
      if (key) {
        if (key.type === 'block-seq')
          onError(
            offset,
            'A block sequence may not be used as an implicit map key'
          )
        else if ('indent' in key && key.indent !== indent)
          onError(offset, startColMsg)
      }
      if (!keyProps.anchor && !keyProps.tagName && !sep) {
        // TODO: assert being at last item?
        if (keyProps.comment) {
          if (map.comment) map.comment += '\n' + keyProps.comment
          else map.comment = keyProps.comment
        }
        continue
      }
    } else if (keyProps.found?.indent !== indent) onError(offset, startColMsg)
    offset += keyProps.length
    if (implicitKey && containsNewline(key))
      onError(offset, 'Implicit keys need to be on a single line')

    // key value
    const keyStart = offset
    const keyNode = key
      ? composeNode(ctx, key, keyProps, onError)
      : composeEmptyNode(ctx, offset, start, null, keyProps, onError)
    offset = keyNode.range[1]

    // value properties
    const valueProps = resolveProps(
      ctx,
      sep || [],
      !key || key.type === 'block-scalar',
      'map-value-ind',
      offset,
      onError
    )
    offset += valueProps.length

    if (valueProps.found) {
      if (implicitKey) {
        if (value?.type === 'block-map' && !valueProps.hasNewline)
          onError(offset, 'Nested mappings are not allowed in compact mappings')
        if (
          ctx.options.strict &&
          keyProps.start < valueProps.found.offset - 1024
        )
          onError(
            offset,
            'The : indicator must be at most 1024 chars after the start of an implicit block mapping key'
          )
      }
      // value value
      const valueNode = value
        ? composeNode(ctx, value, valueProps, onError)
        : composeEmptyNode(ctx, offset, sep, null, valueProps, onError)
      offset = valueNode.range[1]
      map.items.push(new Pair(keyNode, valueNode))
    } else {
      // key with no value
      if (implicitKey)
        onError(keyStart, 'Implicit map keys need to be followed by map values')
      if (valueProps.comment) {
        if (keyNode.comment) keyNode.comment += '\n' + valueProps.comment
        else keyNode.comment = valueProps.comment
      }
      map.items.push(new Pair(keyNode))
    }
  }
  map.range = [start, offset]
  return map as YAMLMap.Parsed
}
