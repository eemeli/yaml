import Collection, { toJSON } from './Collection'
import { addComment } from './Node'
import Scalar from './Scalar'

export default class Pair {
  constructor (key, value = null) {
    this.key = key
    this.value = value
  }

  get comment () {
    return this.value && this.value.comment
  }

  set comment (comment) {
    if (this.value == null) this.value = new Scalar(null)
    this.value.comment = comment
  }

  get stringKey () {
    const key = toJSON(this.key)
    if (key === null) return ''
    if (typeof key === 'object') try { return JSON.stringify(key) }
    catch (e) { /* should not happen, but let's ignore in any case */ }
    return String(key)
  }

  toJSON () {
    const pair = {}
    pair[this.stringKey] = toJSON(this.value)
    return pair
  }

  toString (tags, options, onComment) {
    if (!tags) return JSON.stringify(this)
    const { key, value } = this
    const { indent } = options
    const explicitKey = !key || key.comment || key instanceof Collection
    const opt = Object.assign({}, options, {
      implicitKey: !explicitKey,
      indent: options.indent + '  '
    })
    let keyComment = key && key.comment
    let keyStr = tags.stringify(key, opt, () => { keyComment = null })
    if (keyComment) keyStr = addComment(keyStr, opt.indent, keyComment)
    opt.implicitKey = false
    const valueStr = tags.stringify(value, opt, onComment)
    if (explicitKey) {
      return `? ${keyStr}\n${indent}: ${valueStr}`
    } else if (value instanceof Collection) {
      return `${keyStr}:\n${opt.indent}${valueStr}`
    } else {
      return `${keyStr}: ${valueStr}`
    }
  }
}

