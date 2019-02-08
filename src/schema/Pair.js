// Published as 'yaml/pair'

import addComment from '../addComment'
import toJSON from '../toJSON'
import Collection from './Collection'
import Node from './Node'
import Scalar from './Scalar'

export default class Pair extends Node {
  constructor(key, value = null) {
    super()
    this.key = key
    this.value = value
    this.type = 'PAIR'
  }

  get commentBefore() {
    return this.key && this.key.commentBefore
  }

  set commentBefore(cb) {
    if (this.key == null) this.key = new Scalar(null)
    this.key.commentBefore = cb
  }

  get stringKey() {
    const key = toJSON(this.key)
    if (key === null) return ''
    if (typeof key === 'object')
      try {
        return JSON.stringify(key)
      } catch (e) {
        /* should not happen, but let's ignore in any case */
      }
    return String(key)
  }

  toJSON(_, ctx) {
    const pair = {}
    const sk = this.stringKey
    pair[sk] = toJSON(this.value, sk, ctx)
    return pair
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx || !ctx.doc) return JSON.stringify(this)
    let { key, value } = this
    let keyComment = key instanceof Node && key.comment
    const explicitKey = !key || keyComment || key instanceof Collection
    const { doc, indent } = ctx
    ctx = Object.assign({}, ctx, {
      implicitKey: !explicitKey,
      indent: indent + '  '
    })
    let chompKeep = false
    let str = doc.schema.stringify(
      key,
      ctx,
      () => (keyComment = null),
      () => (chompKeep = true)
    )
    str = addComment(str, ctx.indent, keyComment)
    if (ctx.allNullValues) {
      if (this.comment) {
        str = addComment(str, ctx.indent, this.comment)
        if (onComment) onComment()
      } else if (chompKeep && !keyComment && onChompKeep) onChompKeep()
      return ctx.inFlow ? str : `? ${str}`
    }
    str = explicitKey ? `? ${str}\n${indent}:` : `${str}:`
    if (this.comment) {
      // expected (but not strictly required) to be a single-line comment
      str = addComment(str, ctx.indent, this.comment)
      if (onComment) onComment()
    }
    let vcb = ''
    let valueComment = null
    if (value instanceof Node) {
      if (value.spaceBefore) vcb = '\n'
      if (value.commentBefore) {
        const cs = value.commentBefore.replace(/^/gm, `${ctx.indent}#`)
        vcb += `\n${cs}`
      }
      valueComment = value.comment
    } else if (value && typeof value === 'object') {
      value = doc.schema.createNode(value, true)
    }
    ctx.implicitKey = false
    chompKeep = false
    const valueStr = doc.schema.stringify(
      value,
      ctx,
      () => (valueComment = null),
      () => (chompKeep = true)
    )
    let ws = ' '
    if (vcb || this.comment) {
      ws = `${vcb}\n${ctx.indent}`
    } else if (!explicitKey && value instanceof Collection) {
      const flow = valueStr[0] === '[' || valueStr[0] === '{'
      if (!flow || valueStr.includes('\n')) ws = `\n${ctx.indent}`
    }
    if (chompKeep && !valueComment && onChompKeep) onChompKeep()
    return addComment(str + ws + valueStr, ctx.indent, valueComment)
  }
}
