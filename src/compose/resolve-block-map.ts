import type { ParsedNode } from '../nodes/Node.ts'
import { Pair } from '../nodes/Pair.ts'
import { YAMLMap } from '../nodes/YAMLMap.ts'
import type { BlockMap, SourceToken } from '../parse/cst.ts'
import type { CollectionTag } from '../schema/types.ts'
import type { ComposeContext, ComposeNode } from './compose-node.ts'
import type { ComposeErrorHandler } from './composer.ts'
import { resolveProps } from './resolve-props.ts'
import { containsNewline } from './util-contains-newline.ts'
import { flowIndentCheck } from './util-flow-indent-check.ts'
import { mapIncludes } from './util-map-includes.ts'

const startColMsg = 'All mapping items must start at the same column'

/**
 * Extracts key comments from separator tokens.
 * Key comments are single-line comments that appear immediately after the colon.
 * Multi-line comments (where there are additional comments after a newline) should
 * be left as value comments. Returns the extracted comment and modified separator tokens.
 */
function extractKeyComment(sep: SourceToken[]): { keyComment: string, modifiedSep: SourceToken[] } {
  if (!sep.length) return { keyComment: '', modifiedSep: [] }

  let mapValueIndIndex = -1
  let keyComment = ''
  let modifiedSep = [...sep]

  // Find the map-value-ind (colon)
  for (let i = 0; i < sep.length; i++) {
    if (sep[i].type === 'map-value-ind') {
      mapValueIndIndex = i
      break
    }
  }
  if (mapValueIndIndex === -1) return { keyComment: '', modifiedSep: sep }

  // Only treat comments as key comments if they are immediately after the colon, with only spaces in between (no newline)
  let i = mapValueIndIndex + 1
  while (i < sep.length && sep[i].type === 'space') i++
  if (i < sep.length && sep[i].type === 'comment') {
    // Check for any newline between colon and comment
    let hasNewline = false
    for (let j = mapValueIndIndex + 1; j < i; j++) {
      if (sep[j].type === 'newline') {
        hasNewline = true
        break
      }
    }
    if (!hasNewline) {
      // This comment is inline after the colon
      keyComment = sep[i].source.substring(1) || ' '
      modifiedSep = sep.slice(0, i).concat(sep.slice(i + 1))
    }
  }
  return { keyComment, modifiedSep }
}

export function resolveBlockMap(
  { composeNode, composeEmptyNode }: ComposeNode,
  ctx: ComposeContext,
  bm: BlockMap,
  onError: ComposeErrorHandler,
  tag?: CollectionTag
) {
  const NodeClass = tag?.nodeClass ?? YAMLMap
  const map = new NodeClass(ctx.schema) as YAMLMap<ParsedNode, ParsedNode>

  if (ctx.atRoot) ctx.atRoot = false
  let offset = bm.offset
  let commentEnd: number | null = null
  for (const collItem of bm.items) {
    const { start, key, sep, value } = collItem

    // key properties
    const keyProps = resolveProps(start, {
      indicator: 'explicit-key-ind',
      next: key ?? sep?.[0],
      offset,
      onError,
      parentIndent: bm.indent,
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
        commentEnd = keyProps.end
        if (keyProps.comment) {
          if (map.comment) map.comment += '\n' + keyProps.comment
          else map.comment = keyProps.comment
        }
        continue
      }
      if (keyProps.newlineAfterProp || containsNewline(key)) {
        onError(
          key ?? start[start.length - 1],
          'MULTILINE_IMPLICIT_KEY',
          'Implicit keys need to be on a single line'
        )
      }
    } else if (keyProps.found?.indent !== bm.indent) {
      onError(offset, 'BAD_INDENT', startColMsg)
    }

    // key value
    ctx.atKey = true
    const keyStart = keyProps.end
    const keyNode = key
      ? composeNode(ctx, key, keyProps, onError)
      : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError)
    if (ctx.schema.compat) flowIndentCheck(bm.indent, key, onError)
    ctx.atKey = false

    if (mapIncludes(ctx, map.items, keyNode))
      onError(keyStart, 'DUPLICATE_KEY', 'Map keys must be unique')

    // Extract key comments from separator tokens and modify tokens for value processing
    const { keyComment, modifiedSep } = extractKeyComment(sep ?? [])

    // Apply key comment to the key node if found
    if (keyComment) {
      if (keyNode.comment) keyNode.comment += '\n' + keyComment
      else keyNode.comment = keyComment
    }

    // value properties
    const valueProps = resolveProps(modifiedSep, {
      indicator: 'map-value-ind',
      next: value,
      offset: keyNode.range[2],
      onError,
      parentIndent: bm.indent,
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
      if (ctx.schema.compat) flowIndentCheck(bm.indent, value, onError)
      offset = valueNode.range[2]
      const pair = new Pair(keyNode, valueNode)
      if (ctx.options.keepSourceTokens) pair.srcToken = collItem
      map.items.push(pair)
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
      const pair: Pair<ParsedNode, ParsedNode> = new Pair(keyNode)
      if (ctx.options.keepSourceTokens) pair.srcToken = collItem
      map.items.push(pair)
    }
  }

  if (commentEnd && commentEnd < offset)
    onError(commentEnd, 'IMPOSSIBLE', 'Map comment with trailing content')
  map.range = [bm.offset, offset, commentEnd ?? offset]
  return map as YAMLMap.Parsed
}
