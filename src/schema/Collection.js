import { YAMLSyntaxError } from '../errors'

export const toJSON = (value) => Array.isArray(value) ? (
  value.map(toJSON)
 ) : value && typeof value === 'object' && ('toJSON' in value) ? (
   value.toJSON()
 ) : value

export class Pair {
  constructor (key, value = null) {
    this.key = key
    this.value = value
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

  toString (tags, options) {
    const { key, value } = this
    const opt = Object.assign({}, options, { implicitKey: true })
    const stringifyKey = tags ? tags.getStringifier(key) : Tags.defaultStringifier
    const keyStr = stringifyKey(key, opt)
    opt.implicitKey = false
    opt.indent += '  '
    const stringifyValue = tags ? tags.getStringifier(value) : Tags.defaultStringifier
    const valueStr = stringifyValue(value, opt)
    return `${keyStr} : ${valueStr}`
  }
}

export class Comment {
  constructor (comment, before) {
    this.before = before
    this.comment = comment
  }
}

export default class Collection {
  static checkKeyLength (doc, node, itemIdx, key, keyStart) {
    if (typeof keyStart !== 'number') return
    const item = node.items[itemIdx]
    let keyEnd = item && item.range && item.range.start
    if (!keyEnd) {
      for (let i = itemIdx - 1; i >= 0; --i) {
        const it = node.items[i]
        if (it && it.range) {
          keyEnd = it.range.end + 2 * (itemIdx - i)
          break
        }
      }
    }
    if (keyEnd > keyStart + 1024) {
      const k = String(key).substr(0,8) + '...' + String(key).substr(-8)
      doc.errors.push(new YAMLSyntaxError(node, `The "${k}" key is too long`))
    }
  }

  constructor (doc) {
    this.comments = [] // TODO: include collection & item comments
    this.doc = doc
    this.items = []
  }

  addComment (comment) {
    this.comments.push(new Comment(comment, this.items.length))
  }

  // overridden in implementations
  toJSON () {
    return null
  }
}
