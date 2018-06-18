// Published as 'yaml/seq'

import { Type } from '../ast/Node'
import { YAMLSemanticError, YAMLSyntaxError } from '../errors'
import Collection, { toJSON } from './Collection'
import Pair from './Pair'

export default class YAMLSeq extends Collection {
  parse(ast) {
    ast.resolved = this
    if (ast.type === Type.FLOW_SEQ) {
      this.resolveFlowSeqItems(ast)
    } else {
      this.resolveBlockSeqItems(ast)
    }
    this.resolveComments()
    return this
  }

  resolveBlockSeqItems(seq) {
    for (let i = 0; i < seq.items.length; ++i) {
      const item = seq.items[i]
      switch (item.type) {
        case Type.COMMENT:
          this.addComment(item.comment)
          break
        case Type.SEQ_ITEM:
          if (item.error) this.doc.errors.push(item.error)
          this.items.push(this.doc.resolveNode(item.node))
          if (item.hasProps)
            this.doc.errors.push(
              new YAMLSemanticError(
                item,
                'Sequence items cannot have tags or anchors before the - indicator'
              )
            )
          break
        default:
          this.doc.errors.push(
            new YAMLSyntaxError(
              item,
              `Unexpected ${item.type} node in sequence`
            )
          )
      }
    }
  }

  resolveFlowSeqItems(seq) {
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
            if (key instanceof Pair)
              this.doc.errors.push(
                new YAMLSemanticError(
                  item,
                  'Chaining flow sequence pairs is invalid (e.g. [ a : b : c ])'
                )
              )
            if (!explicitKey)
              Collection.checkKeyLength(this.doc, seq, i, key, keyStart)
          } else {
            key = null
          }
          keyStart = null
          explicitKey = false // TODO: add error for non-explicit multiline plain key
          next = null
        } else if (next === '[' || item !== ']' || i < seq.items.length - 1) {
          this.doc.errors.push(
            new YAMLSyntaxError(
              seq,
              `Flow sequence contains an unexpected ${item}`
            )
          )
        }
      } else if (item.type === Type.COMMENT) {
        this.addComment(item.comment)
      } else {
        if (next)
          this.doc.errors.push(
            new YAMLSemanticError(
              item,
              `Expected a ${next} here in flow sequence`
            )
          )
        const value = this.doc.resolveNode(item)
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
    if (seq.items[seq.items.length - 1] !== ']')
      this.doc.errors.push(
        new YAMLSemanticError(seq, 'Expected flow sequence to end with ]')
      )
    if (key !== undefined) this.items.push(new Pair(key))
  }

  toJSON() {
    return this.items.map(toJSON)
  }

  toString(indent = '', inFlow = false, onComment) {
    return super.toString(
      {
        blockItem: ({ type, str }) => (type === 'comment' ? str : `- ${str}`),
        flowChars: { start: '[', end: ']' },
        indent,
        inFlow,
        itemIndent: indent + (inFlow ? '    ' : '  ')
      },
      onComment
    )
  }
}
