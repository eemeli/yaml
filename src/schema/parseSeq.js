import { Type } from '../constants'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors'
import Pair from './Pair'
import {
  checkFlowCollectionEnd,
  checkKeyLength,
  resolveComments
} from './parseUtils'
import Seq from './Seq'

export default function parseSeq(doc, cst) {
  if (cst.type !== Type.SEQ && cst.type !== Type.FLOW_SEQ) {
    const msg = `A ${cst.type} node cannot be resolved as a sequence`
    doc.errors.push(new YAMLSyntaxError(cst, msg))
    return null
  }
  const { comments, items } =
    cst.type === Type.FLOW_SEQ
      ? resolveFlowSeqItems(doc, cst)
      : resolveBlockSeqItems(doc, cst)
  const seq = new Seq()
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
        items.push(doc.resolveNode(item.node))
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
          if (!explicitKey) checkKeyLength(doc.errors, cst, i, key, keyStart)
        } else {
          key = null
        }
        keyStart = null
        explicitKey = false // TODO: add error for non-explicit multiline plain key
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
      comments.push({ comment: item.comment, before: items.length })
    } else {
      if (next) {
        const msg = `Expected a ${next} in flow sequence`
        doc.errors.push(new YAMLSemanticError(item, msg))
      }
      const value = doc.resolveNode(item)
      if (key === undefined) {
        items.push(value)
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
