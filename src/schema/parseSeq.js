import { Type } from '../cst/Node'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors'
import Pair from './Pair'
import { checkKeyLength, resolveComments } from './parseUtils'
import Seq from './Seq'

export default function parseSeq(doc, cst) {
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
      case Type.COMMENT:
        comments.push({ comment: item.comment, before: items.length })
        break
      case Type.SEQ_ITEM:
        if (item.error) doc.errors.push(item.error)
        items.push(doc.resolveNode(item.node))
        if (item.hasProps)
          doc.errors.push(
            new YAMLSemanticError(
              item,
              'Sequence items cannot have tags or anchors before the - indicator'
            )
          )
        break
      default:
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
    if (typeof item === 'string') {
      if (item !== ':' && (explicitKey || key !== undefined)) {
        if (explicitKey && key === undefined) key = null
        items.push(new Pair(key))
        explicitKey = false
        key = undefined
        keyStart = null
      }
      if (item === next) {
        next = null
      } else if (!next && item === '?') {
        explicitKey = true
      } else if (next !== '[' && item === ':' && key === undefined) {
        if (next === ',') {
          key = items.pop()
          if (key instanceof Pair)
            doc.errors.push(
              new YAMLSemanticError(
                item,
                'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'
              )
            )
          if (!explicitKey) checkKeyLength(doc.errors, cst, i, key, keyStart)
        } else {
          key = null
        }
        keyStart = null
        explicitKey = false // TODO: add error for non-explicit multiline plain key
        next = null
      } else if (next === '[' || item !== ']' || i < cst.items.length - 1) {
        doc.errors.push(
          new YAMLSyntaxError(
            cst,
            `Flow sequence contains an unexpected ${item}`
          )
        )
      }
    } else if (item.type === Type.COMMENT) {
      comments.push({ comment: item.comment, before: items.length })
    } else {
      if (next)
        doc.errors.push(
          new YAMLSemanticError(
            item,
            `Expected a ${next} here in flow sequence`
          )
        )
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
  if (cst.items[cst.items.length - 1] !== ']')
    doc.errors.push(
      new YAMLSemanticError(cst, 'Expected flow sequence to end with ]')
    )
  if (key !== undefined) items.push(new Pair(key))
  return { comments, items }
}
