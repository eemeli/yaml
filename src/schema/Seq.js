import { Type } from 'raw-yaml'

import { YAMLSyntaxError } from '../errors'
import Collection, { Pair, toJSON } from './Collection'

export default class YAMLSeq extends Collection {
  constructor (doc, node) {
    super(doc)
    node.resolved = this
    if (node.type === Type.FLOW_SEQ) {
      this.resolveFlowSeqItems(doc, node)
    } else {
      this.resolveBlockSeqItems(doc, node)
    }
  }

  resolveBlockSeqItems (doc, seq) {
    for (let i = 0; i < seq.items.length; ++i) {
      const item = seq.items[i]
      switch (item.type) {
        case Type.COMMENT:
          this.addComment(item.comment)
          break
        case Type.SEQ_ITEM:
          this.items.push(doc.resolveNode(item.node))
          break
        default:
          doc.errors.push(new YAMLSyntaxError(item,
            `Unexpected ${item.type} node in sequence`))
      }
    }
  }

  resolveFlowSeqItems (doc, seq) {
    let explicitKey = false
    let key = undefined
    let keyStart = null
    let next = '['
    for (let i = 0; i < seq.items.length; ++i) {
      const item = seq.items[i]
      if (typeof item === 'string') {
        if (item !== ':' && (explicitKey || key !== undefined)) {
          if (explicitKey && key === undefined) key = null
          this.items.push(new Pair(key))
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
            key = this.items.pop()
            if (key instanceof Pair) doc.errors.push(new YAMLSyntaxError(item,
              'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'))
            if (!explicitKey) Collection.checkKeyLength(doc, seq, i, key, keyStart)
          } else {
            key = null
          }
          keyStart = null
          explicitKey = false // TODO: add error for non-explicit multiline plain key
          next = null
        } else if (next === '[' || item !== ']' || i < seq.items.length - 1) {
          doc.errors.push(new YAMLSyntaxError(seq,
            `Flow sequence contains an unexpected ${item}`))
        }
      } else if (item.type === Type.COMMENT) {
        this.addComment(item.comment)
      } else {
        if (next) doc.errors.push(new YAMLSyntaxError(item,
          `Expected a ${next} here in flow sequence`))
        const value = doc.resolveNode(item)
        if (key === undefined) {
          this.items.push(value)
        } else {
          this.items.push(new Pair(key, value))
          key = undefined
        }
        keyStart = item.range.start
        next = ','
      }
    }
    if (seq.items[seq.items.length - 1] !== ']') doc.errors.push(new YAMLSyntaxError(seq,
      'Expected flow sequence to end with ]'))
    if (key !== undefined) this.items.push(new Pair(key))
  }

  toJSON () {
    return this.items.map(toJSON)
  }

  toString (indent, inFlow) {
    const { tags } = this.doc
    const options = { implicitKey: false, indent: indent + '  ', inFlow, type: null }
    const items = this.items.map(node => tags.getStringifier(node)(node, options))
    if (inFlow) {
      return `[ ${items.join(', ')} ]`
    } else {
      return items.map(item => `$- ${item}`).join(`\n${indent}`)
    }
  }
}
