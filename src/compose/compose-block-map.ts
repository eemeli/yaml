import { Pair, YAMLMap } from '../ast/index.js'
import type { Document } from '../doc/Document.js'
import type { BlockMap } from '../parse/parser.js'
import { composeNode } from './compose-node.js'
import { resolveProps } from './resolve-props.js'

export function composeBlockMap(
  doc: Document.Parsed,
  { items, offset }: BlockMap,
  anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const start = offset
  const map = new YAMLMap(doc.schema)
  if (anchor) doc.anchors.setAnchor(map, anchor)

  for (const { start, key, sep, value } of items) {
    // key properties
    const keyProps = resolveProps(
      doc.directives,
      start,
      'explicit-key-ind',
      offset,
      onError
    )
    if (!keyProps.found) {
      // implicit key
      if (keyProps.anchor || keyProps.tagName || sep) {
        // FIXME: check single-line
        // FIXME: check 1024 chars
      } else {
        // TODO: assert being at last item?
        if (keyProps.comment) {
          if (map.comment) map.comment += '\n' + keyProps.comment
          else map.comment = keyProps.comment
        }
        continue
      }
    }
    offset += keyProps.length

    // key value
    const keyStart = offset
    const keyNode = composeNode(doc, key || offset, keyProps, onError)
    offset = keyNode.range[1]

    // value properties
    const valueProps = resolveProps(
      doc.directives,
      sep || [],
      'map-value-ind',
      offset,
      onError
    )
    offset += valueProps.length

    if (valueProps.found) {
      // value value
      const valueNode = composeNode(doc, value || offset, valueProps, onError)
      offset = valueNode.range[1]
      map.items.push(new Pair(keyNode, valueNode))
    } else {
      // key with no value
      if (!keyProps.found)
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
