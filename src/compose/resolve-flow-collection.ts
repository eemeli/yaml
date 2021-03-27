import { isNode, isPair, ParsedNode } from '../nodes/Node.js'
import { Pair } from '../nodes/Pair.js'
import { YAMLMap } from '../nodes/YAMLMap.js'
import { YAMLSeq } from '../nodes/YAMLSeq.js'
import type { FlowCollection, SourceToken, Token } from '../parse/tokens.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import { resolveEnd } from './resolve-end.js'
import { containsNewline } from './util-contains-newline.js'

export function resolveFlowCollection(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  fc: FlowCollection,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const isMap = fc.start.source === '{'
  const coll = isMap ? new YAMLMap(ctx.schema) : new YAMLSeq(ctx.schema)
  coll.flow = true

  let key: ParsedNode | null = null
  let value: ParsedNode | null = null

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

  function addItem(pos: number) {
    if (value) {
      if (hasComment) value.comment = comment
    } else {
      value = composeEmptyNode(ctx, offset, fc.items, pos, getProps(), onError)
    }
    if (isMap || atExplicitKey) {
      coll.items.push(key ? new Pair(key, value) : new Pair(value))
    } else {
      const seq = coll as YAMLSeq
      if (key) {
        const map = new YAMLMap(ctx.schema)
        map.flow = true
        map.items.push(new Pair(key, value))
        seq.items.push(map)
      } else seq.items.push(value)
    }
  }

  for (let i = 0; i < fc.items.length; ++i) {
    const token = fc.items[i]
    let isSourceToken = true
    switch (token.type) {
      case 'space':
        hasSpace = true
        break
      case 'comment': {
        if (ctx.options.strict && !hasSpace)
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
      }
      case 'newline':
        if (atLineStart && !hasComment) spaceBefore = true
        if (atValueEnd) {
          if (hasComment) {
            let node = coll.items[coll.items.length - 1]
            if (isPair(node)) node = node.value || node.key
            /* istanbul ignore else should not happen */
            if (isNode(node)) node.comment = comment
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
        const tn = ctx.directives.tagName(token.source, m => onError(offset, m))
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
            const map = new YAMLMap(ctx.schema)
            map.flow = true
            map.items.push(new Pair(key, value))
            map.range = [key.range[0], value.range[1]]
            key = map as YAMLMap.Parsed
            value = null
          } // else explicit key
        } else if (value) {
          if (ctx.options.strict) {
            const slMsg =
              'Implicit keys of flow sequence pairs need to be on a single line'
            if (nlAfterValueInSeq) onError(offset, slMsg)
            else if (seqKeyToken) {
              if (containsNewline(seqKeyToken)) onError(offset, slMsg)
              if (seqKeyToken.offset < offset - 1024)
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
          key = composeEmptyNode(ctx, offset, fc.items, i, getProps(), onError)
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
        if (key || value || anchor || tagName || atExplicitKey) addItem(i)
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
      case 'block-map':
      case 'block-seq':
        onError(
          offset,
          'Block collections are not allowed within flow collections'
        )
      // fallthrough
      default: {
        if (value) onError(offset, 'Missing , between flow collection items')
        if (!isMap && !key && !atExplicitKey) seqKeyToken = token
        value = composeNode(ctx, token, getProps(), onError)
        offset = value.range[1]
        atLineStart = false
        isSourceToken = false
        atValueEnd = false
        hasSpace = false
      }
    }
    if (isSourceToken) offset += (token as SourceToken).source.length
  }
  if (key || value || anchor || tagName || atExplicitKey)
    addItem(fc.items.length)

  const expectedEnd = isMap ? '}' : ']'
  const [ce, ...ee] = fc.end
  if (!ce || ce.source !== expectedEnd) {
    const cs = isMap ? 'map' : 'sequence'
    onError(offset, `Expected flow ${cs} to end with ${expectedEnd}`)
  }
  if (ce) offset += ce.source.length
  if (ee.length > 0) {
    const end = resolveEnd(ee, offset, ctx.options.strict, onError)
    if (end.comment) coll.comment = comment
    offset = end.offset
  }

  coll.range = [fc.offset, offset]
  return coll as YAMLMap.Parsed | YAMLSeq.Parsed
}
