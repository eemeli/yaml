import { Pair, YAMLMap } from '../ast/index.js'
import { Type } from '../constants.js'
import type { Document } from '../doc/Document.js'
import type { BlockMap } from '../parse/parser.js'
import { composeNode } from './compose-node.js'
import { resolveMergePair } from './resolve-merge-pair.js'
import { resolveProps } from './resolve-props.js'
import { validateImplicitKey } from './validate-implicit-key.js'

const startColMsg = 'All collection items must start at the same column'

export function resolveBlockMap(
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
    const implicitKey = keyProps.found === -1
    if (implicitKey) {
      if (key && 'indent' in key && key.indent !== indent)
        onError(offset, startColMsg)
      if (keyProps.anchor || keyProps.tagName || sep) {
        const err = validateImplicitKey(key)
        if (err === 'single-line')
          onError(
            offset + keyProps.length,
            'Implicit keys need to be on a single line'
          )
      } else {
        // TODO: assert being at last item?
        if (keyProps.comment) {
          if (map.comment) map.comment += '\n' + keyProps.comment
          else map.comment = keyProps.comment
        }
        continue
      }
    } else if (keyProps.found !== indent) onError(offset, startColMsg)
    offset += keyProps.length

    // key value
    const keyStart = offset
    const keyNode = composeNode(doc, key || offset, keyProps, onError)
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

    if (valueProps.found !== -1) {
      if (implicitKey && value?.type === 'block-map' && !valueProps.hasNewline)
        onError(offset, 'Nested mappings are not allowed in compact mappings')
      // value value
      const valueNode = composeNode(doc, value || offset, valueProps, onError)
      offset = valueNode.range[1]
      const pair = new Pair(keyNode, valueNode)
      map.items.push(doc.schema.merge ? resolveMergePair(pair, onError) : pair)
    } else {
      // key with no value
      if (implicitKey)
        onError(keyStart, 'Implicit map keys need to be followed by map values')
      if (valueProps.comment) {
        if (map.comment) map.comment += '\n' + valueProps.comment
        else map.comment = valueProps.comment
      }
      map.items.push(new Pair(keyNode))
    }
  }
  map.range = [start, offset]
  return map as YAMLMap.Parsed
}
