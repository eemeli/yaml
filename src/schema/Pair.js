// Published as 'yaml/pair'

import addComment from '../addComment'
import Collection, { toJSON } from './Collection'
import Scalar from './Scalar'

export default class Pair {
  constructor(key, value = null) {
    this.key = key
    this.value = value
  }

  get commentBefore() {
    return this.key && this.key.commentBefore
  }

  set commentBefore(cb) {
    if (this.key == null) this.key = new Scalar(null)
    this.key.commentBefore = cb
  }

  get comment() {
    return this.value && this.value.comment
  }

  set comment(comment) {
    if (this.value == null) this.value = new Scalar(null)
    this.value.comment = comment
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

  toJSON() {
    const pair = {}
    pair[this.stringKey] = toJSON(this.value)
    return pair
  }

  toString(ctx, onComment) {
    if (!ctx || !ctx.doc) return JSON.stringify(this)
    const { key, value } = this
    const explicitKey = !key || key.comment || key instanceof Collection
    const { doc, indent } = ctx
    ctx = Object.assign({}, ctx, {
      implicitKey: !explicitKey,
      indent: indent + '  '
    })
    let keyComment = key && key.comment
    let keyStr = doc.schema.stringify(key, ctx, () => {
      keyComment = null
    })
    if (keyComment) keyStr = addComment(keyStr, ctx.indent, keyComment)
    ctx.implicitKey = false
    const valueStr = doc.schema.stringify(value, ctx, onComment)
    const vcb =
      value && value.commentBefore
        ? ` #${value.commentBefore.replace(/\n+(?!\n|$)/g, `$&${ctx.indent}#`)}`
        : ''
    if (explicitKey) {
      return `? ${keyStr}\n${indent}:${
        vcb ? `${vcb}\n${ctx.indent}` : ' '
      }${valueStr}`
    } else if (value instanceof Collection) {
      return `${keyStr}:${vcb}\n${ctx.indent}${valueStr}`
    } else {
      return `${keyStr}:${vcb ? `${vcb}\n${ctx.indent}` : ' '}${valueStr}`
    }
  }
}
