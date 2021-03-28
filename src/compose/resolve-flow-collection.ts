import { Pair } from '../nodes/Pair.js'
import { YAMLMap } from '../nodes/YAMLMap.js'
import { YAMLSeq } from '../nodes/YAMLSeq.js'
import type { FlowCollection } from '../parse/tokens.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveEnd } from './resolve-end.js'
import { resolveProps } from './resolve-props.js'
import { containsNewline } from './util-contains-newline.js'

export function resolveFlowCollection(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  fc: FlowCollection,
  onError: ComposeErrorHandler
) {
  const isMap = fc.start.source === '{'
  const fcName = isMap ? 'flow map' : 'flow sequence'
  const coll = isMap ? new YAMLMap(ctx.schema) : new YAMLSeq(ctx.schema)
  coll.flow = true

  let offset = fc.offset
  for (let i = 0; i < fc.items.length; ++i) {
    const { start, key, sep, value } = fc.items[i]
    const props = resolveProps(start, {
      ctx,
      flow: fcName,
      indicator: 'explicit-key-ind',
      offset,
      onError,
      startOnNewline: false
    })
    if (!props.found) {
      if (!props.anchor && !props.tagName && !sep && !value) {
        if (i === 0 && props.comma)
          onError(
            props.comma.offset,
            'UNEXPECTED_TOKEN',
            `Unexpected , in ${fcName}`
          )
        else if (i < fc.items.length - 1)
          onError(
            props.start,
            'UNEXPECTED_TOKEN',
            `Unexpected empty item in ${fcName}`
          )
        if (props.comment) {
          if (coll.comment) coll.comment += '\n' + props.comment
          else coll.comment = props.comment
        }
        continue
      }
      if (!isMap && ctx.options.strict && containsNewline(key))
        onError(
          props.start,
          'MULTILINE_IMPLICIT_KEY',
          'Implicit keys of flow sequence pairs need to be on a single line'
        )
    }
    if (i === 0) {
      if (props.comma)
        onError(
          props.comma.offset,
          'UNEXPECTED_TOKEN',
          `Unexpected , in ${fcName}`
        )
    } else if (!props.comma)
      onError(props.start, 'MISSING_CHAR', `Missing , between ${fcName} items`)

    for (const token of [key, value])
      if (token && (token.type === 'block-map' || token.type === 'block-seq'))
        onError(
          token.offset,
          'BLOCK_IN_FLOW',
          'Block collections are not allowed within flow collections'
        )

    if (!isMap && !sep && !props.found) {
      // item is a value in a seq
      // → key & sep are empty, start does not include ? or :
      const valueNode = value
        ? composeNode(ctx, value, props, onError)
        : composeEmptyNode(ctx, props.end, sep, null, props, onError)
      ;(coll as YAMLSeq).items.push(valueNode)
      offset = valueNode.range[1]
    } else {
      // item is a key+value pair

      // key value
      const keyStart = props.end
      const keyNode = key
        ? composeNode(ctx, key, props, onError)
        : composeEmptyNode(ctx, keyStart, start, null, props, onError)

      // value properties
      const valueProps = resolveProps(sep || [], {
        ctx,
        flow: fcName,
        indicator: 'map-value-ind',
        offset: keyNode.range[1],
        onError,
        startOnNewline: false
      })

      if (valueProps.found) {
        if (!isMap && !props.found && ctx.options.strict) {
          if (sep)
            for (const st of sep) {
              if (st === valueProps.found) break
              if (st.type === 'newline') {
                onError(
                  st.offset,
                  'MULTILINE_IMPLICIT_KEY',
                  'Implicit keys of flow sequence pairs need to be on a single line'
                )
                break
              }
            }
          if (props.start < valueProps.found.offset - 1024)
            onError(
              valueProps.found.offset,
              'KEY_OVER_1024_CHARS',
              'The : indicator must be at most 1024 chars after the start of an implicit flow sequence key'
            )
        }
      } else if (value) {
        if ('source' in value && value.source && value.source[0] === ':')
          onError(
            value.offset,
            'MISSING_CHAR',
            `Missing space after : in ${fcName}`
          )
        else
          onError(
            valueProps.start,
            'MISSING_CHAR',
            `Missing , or : between ${fcName} items`
          )
      }

      // value value
      const valueNode = value
        ? composeNode(ctx, value, valueProps, onError)
        : valueProps.found
        ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError)
        : null

      const pair = new Pair(keyNode, valueNode)
      if (isMap) coll.items.push(pair)
      else {
        const map = new YAMLMap(ctx.schema)
        map.flow = true
        map.items.push(pair)
        ;(coll as YAMLSeq).items.push(map)
      }
      offset = valueNode ? valueNode.range[1] : valueProps.end
    }
  }

  const expectedEnd = isMap ? '}' : ']'
  const [ce, ...ee] = fc.end
  if (!ce || ce.source !== expectedEnd) {
    onError(
      offset + 1,
      'MISSING_CHAR',
      `Expected ${fcName} to end with ${expectedEnd}`
    )
  }
  if (ce) offset += ce.source.length
  if (ee.length > 0) {
    const end = resolveEnd(ee, offset, ctx.options.strict, onError)
    if (end.comment) {
      if (coll.comment) coll.comment += '\n' + end.comment
      else coll.comment = end.comment
    }
    offset = end.offset
  }

  coll.range = [fc.offset, offset]
  return coll as YAMLMap.Parsed | YAMLSeq.Parsed
}
