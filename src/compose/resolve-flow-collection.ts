import { Node, Pair, YAMLMap, YAMLSeq } from '../ast/index.js'
import { Type } from '../constants.js'
import type { Document } from '../doc/Document.js'
import type { FlowCollection, SourceToken } from '../parse/parser.js'
import { composeNode } from './compose-node.js'
import { resolveMergePair } from './resolve-merge-pair.js'

export function resolveFlowCollection(
  doc: Document.Parsed,
  fc: FlowCollection,
  _anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  let offset = fc.offset
  const isMap = fc.start.source === '{'
  const coll = isMap ? new YAMLMap(doc.schema) : new YAMLSeq(doc.schema)
  coll.type = isMap ? Type.FLOW_MAP : Type.FLOW_SEQ
  if (_anchor) doc.anchors.setAnchor(coll, _anchor)

  let key: Node.Parsed | null = null
  let value: Node.Parsed | null = null

  let spaceBefore = false
  let comment = ''
  let hasComment = false
  let newlines = ''
  let anchor = ''
  let tagName = ''

  let atExplicitKey = false
  let atValueEnd = false
  let nlAfterValueInSeq = false

  function getProps() {
    const props = { spaceBefore, comment, anchor, tagName }

    spaceBefore = false
    comment = ''
    hasComment = false
    newlines = ''
    anchor = ''
    tagName = ''

    return props
  }

  function addItem() {
    if (value) {
      if (hasComment) value.comment = comment
    } else {
      value = composeNode(doc, offset, getProps(), onError)
    }
    if (isMap || atExplicitKey) {
      const pair = key ? new Pair(key, value) : new Pair(value)
      coll.items.push(doc.schema.merge ? resolveMergePair(pair, onError) : pair)
    } else {
      const seq = coll as YAMLSeq
      if (key) {
        const map = new YAMLMap(doc.schema)
        map.items.push(new Pair(key, value))
        seq.items.push(map)
      } else seq.items.push(value)
    }
  }

  for (const token of fc.items) {
    let isSourceToken = true
    switch (token.type) {
      case 'space':
        break
      case 'comment':
        const cb = token.source.substring(1)
        if (!hasComment) {
          if (newlines) spaceBefore = true
          comment = cb
        } else comment += newlines + cb
        hasComment = true
        newlines = ''
        break
      case 'newline':
        if (atValueEnd) {
          if (hasComment) {
            let node = coll.items[coll.items.length - 1]
            if (node instanceof Pair) node = node.value || node.key
            if (node instanceof Node) node.comment = comment
            else onError(offset, 'Error adding trailing comment to node')
            comment = ''
            hasComment = false
          }
          atValueEnd = false
        } else {
          newlines += token.source
          if (!isMap && !key && value) nlAfterValueInSeq = true
        }
        break
      case 'anchor':
        if (anchor) onError(offset, 'A node can have at most one anchor')
        anchor = token.source.substring(1)
        atValueEnd = false
        break
      case 'tag': {
        if (tagName) onError(offset, 'A node can have at most one tag')
        const tn = doc.directives.tagName(token.source, m => onError(offset, m))
        if (tn) tagName = tn
        atValueEnd = false
        break
      }
      case 'explicit-key-ind':
        if (anchor || tagName)
          onError(offset, 'Anchors and tags must be after the ? indicator')
        atExplicitKey = true
        atValueEnd = false
        break
      case 'map-value-ind': {
        if (key) {
          if (value) {
            onError(offset, 'Missing {} around pair used as mapping key')
            const map = new YAMLMap(doc.schema)
            map.items.push(new Pair(key, value))
            map.range = [key.range[0], value.range[1]]
            key = map as YAMLMap.Parsed
            value = null
          } // else explicit key
        } else if (value) {
          if (doc.options.strict && nlAfterValueInSeq)
            onError(
              offset,
              'Implicit keys of flow sequence pairs need to be on a single line'
            )
          key = value
          value = null
        } else {
          key = composeNode(doc, offset, getProps(), onError) // empty node
        }
        if (hasComment) {
          key.comment = comment
          comment = ''
          hasComment = false
        }
        atExplicitKey = false
        atValueEnd = false
        break
      }
      case 'comma':
        addItem()
        atExplicitKey = false
        atValueEnd = true
        nlAfterValueInSeq = false
        key = null
        value = null
        break
      default: {
        if (value) onError(offset, 'Missing , between flow collection items')
        value = composeNode(doc, token, getProps(), onError)
        offset = value.range[1]
        isSourceToken = false
        atValueEnd = false
      }
    }
    if (isSourceToken) offset += (token as SourceToken).source.length
  }
  if (key || value || atExplicitKey) addItem()
  coll.range = [fc.offset, offset]
  return coll as YAMLMap.Parsed | YAMLSeq.Parsed
}
