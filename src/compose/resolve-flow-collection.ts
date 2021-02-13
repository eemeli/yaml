import { Node, Pair, YAMLMap, YAMLSeq } from '../ast/index.js'
import { Type } from '../constants.js'
import type { Document } from '../doc/Document.js'
import type { FlowCollection, SourceToken, Token } from '../parse/tokens.js'
import { composeNode } from './compose-node.js'
import { resolveEnd } from './resolve-end.js'
import { resolveMergePair } from './resolve-merge-pair.js'
import { containsNewline } from './util-contains-newline.js'

export function resolveFlowCollection(
  doc: Document.Parsed,
  fc: FlowCollection,
  _anchor: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const isMap = fc.start.source === '{'
  const coll = isMap ? new YAMLMap(doc.schema) : new YAMLSeq(doc.schema)
  coll.type = isMap ? Type.FLOW_MAP : Type.FLOW_SEQ
  if (_anchor) doc.anchors.setAnchor(coll, _anchor)

  let key: Node.Parsed | null = null
  let value: Node.Parsed | null = null

  let spaceBefore = false
  let comment = ''
  let hasSpace = false
  let hasComment = false
  let newlines = ''
  let anchor = ''
  let tagName = ''

  let offset = fc.offset + 1
  let atLineStart = false
  let atExplicitKey = false
  let atValueEnd = false
  let nlAfterValueInSeq = false
  let seqKeyToken: Token | null = null

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
        map.type = Type.FLOW_MAP
        map.items.push(new Pair(key, value))
        seq.items.push(map)
      } else seq.items.push(value)
    }
  }

  for (const token of fc.items) {
    let isSourceToken = true
    switch (token.type) {
      case 'space':
        hasSpace = true
        break
      case 'comment':
        if (doc.options.strict && !hasSpace)
          onError(
            offset,
            'Comments must be separated from other tokens by white space characters'
          )
        const cb = token.source.substring(1)
        if (!hasComment) comment = cb
        else comment += newlines + cb
        atLineStart = false
        hasComment = true
        newlines = ''
        break
      case 'newline':
        if (atLineStart && !hasComment) spaceBefore = true
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
        atLineStart = true
        hasSpace = true
        break
      case 'anchor':
        if (anchor) onError(offset, 'A node can have at most one anchor')
        anchor = token.source.substring(1)
        atLineStart = false
        atValueEnd = false
        hasSpace = false
        break
      case 'tag': {
        if (tagName) onError(offset, 'A node can have at most one tag')
        const tn = doc.directives.tagName(token.source, m => onError(offset, m))
        if (tn) tagName = tn
        atLineStart = false
        atValueEnd = false
        hasSpace = false
        break
      }
      case 'explicit-key-ind':
        if (anchor || tagName)
          onError(offset, 'Anchors and tags must be after the ? indicator')
        atExplicitKey = true
        atLineStart = false
        atValueEnd = false
        hasSpace = false
        break
      case 'map-value-ind': {
        if (key) {
          if (value) {
            onError(offset, 'Missing {} around pair used as mapping key')
            const map = new YAMLMap(doc.schema)
            map.type = Type.FLOW_MAP
            map.items.push(new Pair(key, value))
            map.range = [key.range[0], value.range[1]]
            key = map as YAMLMap.Parsed
            value = null
          } // else explicit key
        } else if (value) {
          if (doc.options.strict) {
            const slMsg =
              'Implicit keys of flow sequence pairs need to be on a single line'
            if (nlAfterValueInSeq) onError(offset, slMsg)
            else if (seqKeyToken) {
              if (containsNewline(seqKeyToken)) onError(offset, slMsg)
              const start = 'offset' in seqKeyToken && seqKeyToken.offset
              if (typeof start === 'number' && start < offset - 1024)
                onError(
                  offset,
                  'The : indicator must be at most 1024 chars after the start of an implicit flow sequence key'
                )
              seqKeyToken = null
            }
          }
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
        hasSpace = false
        break
      }
      case 'comma':
        if (key || value || anchor || tagName || atExplicitKey) addItem()
        else
          onError(offset, `Unexpected , in flow ${isMap ? 'map' : 'sequence'}`)
        key = null
        value = null
        atExplicitKey = false
        atValueEnd = true
        hasSpace = false
        nlAfterValueInSeq = false
        seqKeyToken = null
        break
      default: {
        if (value) onError(offset, 'Missing , between flow collection items')
        if (!isMap && !key && !atExplicitKey) seqKeyToken = token
        value = composeNode(doc, token, getProps(), onError)
        offset = value.range[1]
        atLineStart = false
        isSourceToken = false
        atValueEnd = false
        hasSpace = false
      }
    }
    if (isSourceToken) offset += (token as SourceToken).source.length
  }
  if (key || value || anchor || tagName || atExplicitKey) addItem()

  const expectedEnd = isMap ? '}' : ']'
  const [ce, ...ee] = fc.end
  if (!ce || ce.source !== expectedEnd) {
    const cs = isMap ? 'map' : 'sequence'
    onError(offset, `Expected flow ${cs} to end with ${expectedEnd}`)
  }
  if (ce) offset += ce.source.length
  if (ee.length > 0) {
    const end = resolveEnd(ee, offset, doc.options.strict, onError)
    if (end.comment) coll.comment = comment
    offset = end.offset
  }

  coll.range = [fc.offset, offset]
  return coll as YAMLMap.Parsed | YAMLSeq.Parsed
}
