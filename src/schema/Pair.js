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

  toJSON(_, opt) {
    const pair = {}
    const sk = this.stringKey
    pair[sk] = toJSON(this.value, sk, opt)
    return pair
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx || !ctx.doc) return JSON.stringify(this)
    const { key, value } = this
    let keyComment = key instanceof Node && key.comment
    const explicitKey = !key || keyComment || key instanceof Collection
    const { doc, indent } = ctx
    ctx = Object.assign({}, ctx, {
      implicitKey: !explicitKey,
      indent: indent + '  '
    })
    let str = doc.schema.stringify(key, ctx, () => {
      keyComment = null
    })
    str = addComment(str, ctx.indent, keyComment)
    str = explicitKey ? `? ${str}\n${indent}:` : `${str}:` // FIXME: Allow for `? key` w/o value
    if (this.comment) {
      // expected (but not strictly required) to be a single-line comment
      str = addComment(str, ctx.indent, this.comment)
      if (onComment) onComment()
    }
    let vcb = ''
    if (value) {
      if (value.spaceBefore) vcb = '\n'
      if (value.commentBefore) {
        const cs = value.commentBefore.replace(/^/gm, `${ctx.indent}#`)
        vcb += `\n${cs}`
      }
    }
    ctx.implicitKey = false
    let valueComment = value instanceof Node && value.comment
    let chompKeep = false
    let valueStr = doc.schema.stringify(
      value,
      ctx,
      () => (valueComment = null),
      () => (chompKeep = true)
    )
    const ws =
      vcb || this.comment || (!explicitKey && value instanceof Collection)
        ? `${vcb}\n${ctx.indent}`
        : ' '
    if (chompKeep && !valueComment && onChompKeep) onChompKeep()
    return addComment(str + ws + valueStr, ctx.indent, valueComment)
  }
}
