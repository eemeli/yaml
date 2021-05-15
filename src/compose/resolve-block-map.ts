import type { ParsedNode } from '../nodes/Node.js'
import { Pair } from '../nodes/Pair.js'
import { YAMLMap } from '../nodes/YAMLMap.js'
import type { BlockMap, Token } from '../parse/cst.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveProps } from './resolve-props.js'
import { containsNewline } from './util-contains-newline.js'
import { mapIncludes } from './util-map-includes.js'

const startColMsg = 'All mapping items must start at the same column'

export function resolveBlockMap(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  bm: BlockMap,
  onError: ComposeErrorHandler
) {
  const map = new YAMLMap<ParsedNode, ParsedNode>(ctx.schema)

  let offset = bm.offset
  for (const { start, key, sep, value } of bm.items) {
    // key properties
    const keyProps = resolveProps(start, {
      ctx,
      indicator: 'explicit-key-ind',
      offset,
      onError,
      startOnNewline: true
    })
    const implicitKey = !keyProps.found
    if (implicitKey) {
      if (key) {
        if (key.type === 'block-seq')
          onError(
            offset,
            'BLOCK_AS_IMPLICIT_KEY',
            'A block sequence may not be used as an implicit map key'
          )
        else if ('indent' in key && key.indent !== bm.indent)
          onError(offset, 'BAD_INDENT', startColMsg)
      }
      if (!keyProps.anchor && !keyProps.tag && !sep) {
        // TODO: assert being at last item?
        if (keyProps.comment) {
          if (map.comment) map.comment += '\n' + keyProps.comment
          else map.comment = keyProps.comment
        }
        continue
      }
    } else if (keyProps.found?.indent !== bm.indent)
      onError(offset, 'BAD_INDENT', startColMsg)
    if (implicitKey && containsNewline(key))
      onError(
        key as Token, // checked by containsNewline()
        'MULTILINE_IMPLICIT_KEY',
        'Implicit keys need to be on a single line'
      )

    // key value
    const keyStart = keyProps.end
    const keyNode = key
      ? composeNode(ctx, key, keyProps, onError)
      : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError)

    if (mapIncludes(ctx, map.items, keyNode))
      onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique')

    // value properties
    const valueProps = resolveProps(sep || [], {
      ctx,
      indicator: 'map-value-ind',
      offset: keyNode.range[2],
      onError,
      startOnNewline: !key || key.type === 'block-scalar'
    })
    offset = valueProps.end

    if (valueProps.found) {
      if (implicitKey) {
        if (value?.type === 'block-map' && !valueProps.hasNewline)
          onError(
            offset,
            'BLOCK_AS_IMPLICIT_KEY',
            'Nested mappings are not allowed in compact mappings'
          )
        if (
          ctx.options.strict &&
          keyProps.start < valueProps.found.offset - 1024
        )
          onError(
            keyNode.range,
            'KEY_OVER_1024_CHARS',
            'The : indicator must be at most 1024 chars after the start of an implicit block mapping key'
          )
      }
      // value value
      const valueNode = value
        ? composeNode(ctx, value, valueProps, onError)
        : composeEmptyNode(ctx, offset, sep, null, valueProps, onError)
      offset = valueNode.range[2]
      map.items.push(new Pair(keyNode, valueNode))
    } else {
      // key with no value
      if (implicitKey)
        onError(
          keyNode.range,
          'MISSING_CHAR',
          'Implicit map keys need to be followed by map values'
        )
      if (valueProps.comment) {
        if (keyNode.comment) keyNode.comment += '\n' + valueProps.comment
        else keyNode.comment = valueProps.comment
      }
      map.items.push(new Pair(keyNode))
    }
  }

  map.range = [bm.offset, offset, offset]
  return map as YAMLMap.Parsed
}
