import { Pair } from '../ast/Pair.js'
import { YAMLSeq } from '../ast/YAMLSeq.js'
import { Type } from '../constants.js'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors.js'

import {
  checkFlowCollectionEnd,
  checkFlowCommentSpace,
  getLongKeyError,
  resolveComments
} from './collection-utils.js'
import { resolveNode } from './resolveNode.js'

export function resolveSeq(doc, cst) {
  const { comments, items } =
    cst.type === Type.FLOW_SEQ
      ? resolveFlowSeqItems(doc, cst)
      : resolveBlockSeqItems(doc, cst)
  const seq = new YAMLSeq(doc.schema)
  seq.items = items
  resolveComments(seq, comments)
  cst.resolved = seq
  return seq
}

function resolveBlockSeqItems(doc, cst) {
  const comments = []
  const items = []
  for (let i = 0; i < cst.items.length; ++i) {
    const item = cst.items[i]
    switch (item.type) {
      case Type.BLANK_LINE:
        comments.push({ before: items.length })
        break
      case Type.COMMENT:
        comments.push({ comment: item.comment, before: items.length })
        break
      case Type.SEQ_ITEM:
        if (item.error) doc.errors.push(item.error)
        items.push(resolveNode(doc, item.node))
        if (item.hasProps) {
          const msg =
            'Sequence items cannot have tags or anchors before the - indicator'
          doc.errors.push(new YAMLSemanticError(item, msg))
        }
        break
      default:
        if (item.error) doc.errors.push(item.error)
        doc.errors.push(
          new YAMLSyntaxError(item, `Unexpected ${item.type} node in sequence`)
        )
    }
  }
  return { comments, items }
}

function resolveFlowSeqItems(doc, cst) {
  const comments = []
  const items = []
  let explicitKey = false
  let key = undefined
  let keyStart = null
  let next = '['
  let prevItem = null
  for (let i = 0; i < cst.items.length; ++i) {
    const item = cst.items[i]
    if (typeof item.char === 'string') {
      const { char, offset } = item
      if (char !== ':' && (explicitKey || key !== undefined)) {
        if (explicitKey && key === undefined) key = next ? items.pop() : null
        items.push(new Pair(key))
        explicitKey = false
        key = undefined
        keyStart = null
      }
      if (char === next) {
        next = null
      } else if (!next && char === '?') {
        explicitKey = true
      } else if (next !== '[' && char === ':' && key === undefined) {
        if (next === ',') {
          key = items.pop()
          if (key instanceof Pair) {
            const msg = 'Chaining flow sequence pairs is invalid'
            const err = new YAMLSemanticError(cst, msg)
            err.offset = offset
            doc.errors.push(err)
          }
          if (!explicitKey && typeof keyStart === 'number') {
            const keyEnd = item.range ? item.range.start : item.offset
            if (keyEnd > keyStart + 1024)
              doc.errors.push(getLongKeyError(cst, key))
            const { src } = prevItem.context
            for (let i = keyStart; i < keyEnd; ++i)
              if (src[i] === '\n') {
                const msg =
                  'Implicit keys of flow sequence pairs need to be on a single line'
                doc.errors.push(new YAMLSemanticError(prevItem, msg))
                break
              }
          }
        } else {
          key = null
        }
        keyStart = null
        explicitKey = false
        next = null
      } else if (next === '[' || char !== ']' || i < cst.items.length - 1) {
        const msg = `Flow sequence contains an unexpected ${char}`
        const err = new YAMLSyntaxError(cst, msg)
        err.offset = offset
        doc.errors.push(err)
      }
    } else if (item.type === Type.BLANK_LINE) {
      comments.push({ before: items.length })
    } else if (item.type === Type.COMMENT) {
      checkFlowCommentSpace(doc.errors, item)
      comments.push({ comment: item.comment, before: items.length })
    } else {
      if (next) {
        const msg = `Expected a ${next} in flow sequence`
        doc.errors.push(new YAMLSemanticError(item, msg))
      }
      const value = resolveNode(doc, item)
      if (key === undefined) {
        items.push(value)
        prevItem = item
      } else {
        items.push(new Pair(key, value))
        key = undefined
      }
      keyStart = item.range.start
      next = ','
    }
  }
  checkFlowCollectionEnd(doc.errors, cst)
  if (key !== undefined) items.push(new Pair(key))
  return { comments, items }
}
