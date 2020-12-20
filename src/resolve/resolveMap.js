import { Alias } from '../ast/Alias.js'
import { Merge, MERGE_KEY } from '../ast/Merge.js'
import { Pair } from '../ast/Pair.js'
import { YAMLMap } from '../ast/YAMLMap.js'
import { Char, Type } from '../constants.js'
import { PlainValue } from '../cst/PlainValue.js'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors.js'

import {
  checkFlowCollectionEnd,
  checkFlowCommentSpace,
  getLongKeyError,
  resolveComments
} from './collection-utils.js'
import { resolveNode } from './resolveNode.js'

export function resolveMap(doc, cst) {
  const { comments, items } =
    cst.type === Type.FLOW_MAP
      ? resolveFlowMapItems(doc, cst)
      : resolveBlockMapItems(doc, cst)
  const map = new YAMLMap(doc.schema)
  map.items = items
  resolveComments(map, comments)
  for (let i = 0; i < items.length; ++i) {
    const { key: iKey } = items[i]
    if (doc.schema.merge && iKey && iKey.value === MERGE_KEY) {
      items[i] = new Merge(items[i])
      const sources = items[i].value.items
      let error = null
      sources.some(node => {
        if (node instanceof Alias) {
          // During parsing, alias sources are CST nodes; to account for
          // circular references their resolved values can't be used here.
          const { type } = node.source
          if (type === Type.MAP || type === Type.FLOW_MAP) return false
          return (error = 'Merge nodes aliases can only point to maps')
        }
        return (error = 'Merge nodes can only have Alias nodes as values')
      })
      if (error) doc.errors.push(new YAMLSemanticError(cst, error))
    } else {
      for (let j = i + 1; j < items.length; ++j) {
        const { key: jKey } = items[j]
        if (
          iKey === jKey ||
          (iKey &&
            jKey &&
            Object.prototype.hasOwnProperty.call(iKey, 'value') &&
            iKey.value === jKey.value)
        ) {
          const msg = `Map keys must be unique; "${iKey}" is repeated`
          doc.errors.push(new YAMLSemanticError(cst, msg))
          break
        }
      }
    }
  }
  cst.resolved = map
  return map
}

const valueHasPairComment = ({ context: { lineStart, node, src }, props }) => {
  if (props.length === 0) return false
  const { start } = props[0]
  if (node && start > node.valueRange.start) return false
  if (src[start] !== Char.COMMENT) return false
  for (let i = lineStart; i < start; ++i) if (src[i] === '\n') return false
  return true
}

function resolvePairComment(item, pair) {
  if (!valueHasPairComment(item)) return
  const comment = item.getPropValue(0, Char.COMMENT, true)
  let found = false
  const cb = pair.value.commentBefore
  if (cb && cb.startsWith(comment)) {
    pair.value.commentBefore = cb.substr(comment.length + 1)
    found = true
  } else {
    const cc = pair.value.comment
    if (!item.node && cc && cc.startsWith(comment)) {
      pair.value.comment = cc.substr(comment.length + 1)
      found = true
    }
  }
  if (found) pair.comment = comment
}

function resolveBlockMapItems(doc, cst) {
  const comments = []
  const items = []
  let key = undefined
  let keyStart = null
  for (let i = 0; i < cst.items.length; ++i) {
    const item = cst.items[i]
    switch (item.type) {
      case Type.BLANK_LINE:
        comments.push({ afterKey: !!key, before: items.length })
        break
      case Type.COMMENT:
        comments.push({
          afterKey: !!key,
          before: items.length,
          comment: item.comment
        })
        break
      case Type.MAP_KEY:
        if (key !== undefined) items.push(new Pair(key))
        if (item.error) doc.errors.push(item.error)
        key = resolveNode(doc, item.node)
        keyStart = null
        break
      case Type.MAP_VALUE:
        {
          if (key === undefined) key = null
          if (item.error) doc.errors.push(item.error)
          if (
            !item.context.atLineStart &&
            item.node &&
            item.node.type === Type.MAP &&
            !item.node.context.atLineStart
          ) {
            const msg = 'Nested mappings are not allowed in compact mappings'
            doc.errors.push(new YAMLSemanticError(item.node, msg))
          }
          let valueNode = item.node
          if (!valueNode && item.props.length > 0) {
            // Comments on an empty mapping value need to be preserved, so we
            // need to construct a minimal empty node here to use instead of the
            // missing `item.node`. -- eemeli/yaml#19
            valueNode = new PlainValue(Type.PLAIN, [])
            valueNode.context = { parent: item, src: item.context.src }
            const pos = item.range.start + 1
            valueNode.range = { start: pos, end: pos }
            valueNode.valueRange = { start: pos, end: pos }
            if (typeof item.range.origStart === 'number') {
              const origPos = item.range.origStart + 1
              valueNode.range.origStart = valueNode.range.origEnd = origPos
              valueNode.valueRange.origStart = valueNode.valueRange.origEnd = origPos
            }
          }
          const pair = new Pair(key, resolveNode(doc, valueNode))
          resolvePairComment(item, pair)
          items.push(pair)
          if (key && typeof keyStart === 'number') {
            if (item.range.start > keyStart + 1024)
              doc.errors.push(getLongKeyError(cst, key))
          }
          key = undefined
          keyStart = null
        }
        break
      default:
        if (key !== undefined) items.push(new Pair(key))
        key = resolveNode(doc, item)
        keyStart = item.range.start
        if (item.error) doc.errors.push(item.error)
        next: for (let j = i + 1; ; ++j) {
          const nextItem = cst.items[j]
          switch (nextItem && nextItem.type) {
            case Type.BLANK_LINE:
            case Type.COMMENT:
              continue next
            case Type.MAP_VALUE:
              break next
            default: {
              const msg = 'Implicit map keys need to be followed by map values'
              doc.errors.push(new YAMLSemanticError(item, msg))
              break next
            }
          }
        }
        if (item.valueRangeContainsNewline) {
          const msg = 'Implicit map keys need to be on a single line'
          doc.errors.push(new YAMLSemanticError(item, msg))
        }
    }
  }
  if (key !== undefined) items.push(new Pair(key))
  return { comments, items }
}

function resolveFlowMapItems(doc, cst) {
  const comments = []
  const items = []
  let key = undefined
  let explicitKey = false
  let next = '{'
  for (let i = 0; i < cst.items.length; ++i) {
    const item = cst.items[i]
    if (typeof item.char === 'string') {
      const { char, offset } = item
      if (char === '?' && key === undefined && !explicitKey) {
        explicitKey = true
        next = ':'
        continue
      }
      if (char === ':') {
        if (key === undefined) key = null
        if (next === ':') {
          next = ','
          continue
        }
      } else {
        if (explicitKey) {
          if (key === undefined && char !== ',') key = null
          explicitKey = false
        }
        if (key !== undefined) {
          items.push(new Pair(key))
          key = undefined
          if (char === ',') {
            next = ':'
            continue
          }
        }
      }
      if (char === '}') {
        if (i === cst.items.length - 1) continue
      } else if (char === next) {
        next = ':'
        continue
      }
      const msg = `Flow map contains an unexpected ${char}`
      const err = new YAMLSyntaxError(cst, msg)
      err.offset = offset
      doc.errors.push(err)
    } else if (item.type === Type.BLANK_LINE) {
      comments.push({ afterKey: !!key, before: items.length })
    } else if (item.type === Type.COMMENT) {
      checkFlowCommentSpace(doc.errors, item)
      comments.push({
        afterKey: !!key,
        before: items.length,
        comment: item.comment
      })
    } else if (key === undefined) {
      if (next === ',')
        doc.errors.push(
          new YAMLSemanticError(item, 'Separator , missing in flow map')
        )
      key = resolveNode(doc, item)
    } else {
      if (next !== ',')
        doc.errors.push(
          new YAMLSemanticError(item, 'Indicator : missing in flow map entry')
        )
      items.push(new Pair(key, resolveNode(doc, item)))
      key = undefined
      explicitKey = false
    }
  }
  checkFlowCollectionEnd(doc.errors, cst)
  if (key !== undefined) items.push(new Pair(key))
  return { comments, items }
}
