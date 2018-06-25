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

  toString(doc, options, onComment) {
    if (!doc) return JSON.stringify(this)
    const { key, value } = this
    const { indent } = options
    const explicitKey = !key || key.comment || key instanceof Collection
    const opt = Object.assign({}, options, {
      implicitKey: !explicitKey,
      indent: options.indent + '  '
    })
    let keyComment = key && key.comment
    let keyStr = doc.schema.stringify(doc, key, opt, () => {
      keyComment = null
    })
    if (keyComment) keyStr = addComment(keyStr, opt.indent, keyComment)
    opt.implicitKey = false
    const valueStr = doc.schema.stringify(doc, value, opt, onComment)
    const vcb =
      value && value.commentBefore
        ? ` #${value.commentBefore.replace(/\n+(?!\n|$)/g, `$&${opt.indent}#`)}`
        : ''
    if (explicitKey) {
      return `? ${keyStr}\n${indent}:${
        vcb ? `${vcb}\n${opt.indent}` : ' '
      }${valueStr}`
    } else if (value instanceof Collection) {
      return `${keyStr}:${vcb}\n${opt.indent}${valueStr}`
    } else {
      return `${keyStr}:${vcb ? `${vcb}\n${opt.indent}` : ' '}${valueStr}`
    }
  }
}
