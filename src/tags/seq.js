import { Type } from 'raw-yaml'
import { YAMLSyntaxError } from '../errors'

function resolveBlockSeq (doc, node) {
  const seq = node.resolved = []
  const comments = []
  seq.comments = () => comments
  seq.toString = () => JSON.stringify(seq)
  for (let i = 0; i < node.items.length; ++i) {
    const item = node.items[i]
    switch (item.type) {
      case Type.COMMENT:
        comments.push({ before: seq.length, comment: item.comment })
        break
      case Type.SEQ_ITEM:
        seq.push(doc.resolveNode(item.node))
        break
      default:
        doc.errors.push(new YAMLSyntaxError(item, `Unexpected ${item.type} node in sequence`))
    }
  }
  // TODO: include seq & item comments
  return seq
}

class Pair {
  constructor (key, value = null) {
    this.key = key
    this.value = value
  }
}

function resolveFlowSeq (doc, node) {
  const seq = node.resolved = []
  const comments = []
  seq.comments = () => comments
  seq.toString = () => JSON.stringify(seq)
  let explicitKey = false
  let key = undefined
  let next = '['
  for (let i = 0; i < node.items.length; ++i) {
    const item = node.items[i]
    if (typeof item === 'string') {
      if (item !== ':' && (explicitKey || key !== undefined)) {
        if (explicitKey && key === undefined) key = null
        seq.push(new Pair(key))
        explicitKey = false
        key = undefined
      }
      if (item === next) {
        next = null
      } else if (!next && item === '?') {
        explicitKey = true
      } else if (next !== '[' && item === ':' && key === undefined) {
        key = next === ',' ? seq.pop() : null
        if (key instanceof Pair) doc.errors.push(new YAMLSyntaxError(item,
          'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'
        ))
        explicitKey = false // TODO: add error for non-explicit multiline plain key
      } else if (next === '[' || item !== ']' || i < node.items.length - 1) {
        doc.errors.push(new YAMLSyntaxError(node, `Flow sequence contains an unexpected ${item}`))
      }
    } else if (item.type === Type.COMMENT) {
      comments.push({ before: seq.length, comment: item.comment })
    } else {
      if (next) doc.errors.push(new YAMLSyntaxError(item, `Expected a ${next} here in flow sequence`))
      const value = doc.resolveNode(item)
      if (key === undefined) {
        seq.push(value)
      } else {
        seq.push(new Pair(key, value))
        key = undefined
      }
      next = ','
    }
  }
  if (node.items[node.items.length - 1] !== ']') doc.errors.push(new YAMLSyntaxError(node,
    'Expected flow sequence to end with ]'
  ))
  if (key !== undefined) seq.push(new Pair(key))
  // TODO: include seq & item comments
  return seq
}

export default (doc, node) => node.type === Type.FLOW_SEQ ? (
  resolveFlowSeq(doc, node)
) : (
  resolveBlockSeq(doc, node)
)
