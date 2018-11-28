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

  toJSON(_, opt) {
    const pair = {}
    const sk = this.stringKey
    pair[sk] = toJSON(this.value, sk, opt)
    return pair
  }

  toString(ctx, onComment) {
    if (!ctx || !ctx.doc) return JSON.stringify(this)
    const { key, value } = this
    let keyComment = key instanceof Node && key.comment
    const explicitKey = !key || keyComment || key instanceof Collection
    const { doc, indent } = ctx
    ctx = Object.assign({}, ctx, {
      implicitKey: !explicitKey,
      indent: indent + '  '
    })
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
