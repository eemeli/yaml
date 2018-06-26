// Published as 'yaml/seq'

import { Type } from '../ast/Node'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors'
import Collection from './Collection'
import Pair from './Pair'

export default function parseSeq(doc, seq, ast) {
  ast.resolved = seq
  if (ast.type === Type.FLOW_SEQ) {
    resolveFlowSeqItems(doc, seq, ast)
  } else {
    resolveBlockSeqItems(doc, seq, ast)
  }
  seq.resolveComments()
  return seq
}

function resolveBlockSeqItems(doc, seq, ast) {
  for (let i = 0; i < ast.items.length; ++i) {
    const item = ast.items[i]
    switch (item.type) {
      case Type.COMMENT:
        seq.addComment(item.comment)
        break
      case Type.SEQ_ITEM:
        if (item.error) doc.errors.push(item.error)
        seq.items.push(doc.resolveNode(item.node))
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
}

function resolveFlowSeqItems(doc, seq, ast) {
  let explicitKey = false
  let key = undefined
  let keyStart = null
  let next = '['
  for (let i = 0; i < ast.items.length; ++i) {
    const item = ast.items[i]
    if (typeof item === 'string') {
      if (item !== ':' && (explicitKey || key !== undefined)) {
        if (explicitKey && key === undefined) key = null
        seq.items.push(new Pair(key))
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
          key = seq.items.pop()
          if (key instanceof Pair)
            doc.errors.push(
              new YAMLSemanticError(
                item,
                'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'
              )
            )
          if (!explicitKey)
            Collection.checkKeyLength(doc, ast, i, key, keyStart)
        } else {
          key = null
        }
        keyStart = null
        explicitKey = false // TODO: add error for non-explicit multiline plain key
        next = null
      } else if (next === '[' || item !== ']' || i < ast.items.length - 1) {
        doc.errors.push(
          new YAMLSyntaxError(
            ast,
            `Flow sequence contains an unexpected ${item}`
          )
        )
      }
    } else if (item.type === Type.COMMENT) {
      seq.addComment(item.comment)
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
        seq.items.push(value)
      } else {
        seq.items.push(new Pair(key, value))
        key = undefined
      }
      keyStart = item.range.start
      next = ','
    }
  }
  if (ast.items[ast.items.length - 1] !== ']')
    doc.errors.push(
      new YAMLSemanticError(ast, 'Expected flow sequence to end with ]')
    )
  if (key !== undefined) seq.items.push(new Pair(key))
}
