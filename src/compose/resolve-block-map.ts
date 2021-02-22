import { Pair } from '../ast/Pair.js'
import { YAMLMap } from '../ast/YAMLMap.js'
import { Type } from '../constants.js'
import type { Document } from '../doc/Document.js'
import type { BlockMap } from '../parse/tokens.js'
import type { ComposeNode } from './compose-node.js'
import { resolveMergePair } from './resolve-merge-pair.js'
import { resolveProps } from './resolve-props.js'
import { containsNewline } from './util-contains-newline.js'

const startColMsg = 'All mapping items must start at the same column'

export function resolveBlockMap(
  { composeNode, composeEmptyNode }: ComposeNode,
  doc: Document.Parsed,
  { indent, items, offset }: BlockMap,
  anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const start = offset
  const map = new YAMLMap(doc.schema)
  map.type = Type.MAP
  if (anchor) doc.anchors.setAnchor(map, anchor)

  for (const { start, key, sep, value } of items) {
    // key properties
    const keyProps = resolveProps(
      doc,
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
      ? composeNode(doc, key, keyProps, onError)
      : composeEmptyNode(doc, offset, start, null, keyProps, onError)
    offset = keyNode.range[1]

    // value properties
    const valueProps = resolveProps(
      doc,
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
          doc.options.strict &&
          keyProps.start < valueProps.found.offset - 1024
        )
          onError(
            offset,
            'The : indicator must be at most 1024 chars after the start of an implicit block mapping key'
          )
      }
      // value value
      const valueNode = value
        ? composeNode(doc, value, valueProps, onError)
        : composeEmptyNode(doc, offset, sep, null, valueProps, onError)
      offset = valueNode.range[1]
      const pair = new Pair(keyNode, valueNode)
      map.items.push(doc.schema.merge ? resolveMergePair(pair, onError) : pair)
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
