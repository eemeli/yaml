import { YAMLSyntaxError } from '../errors'
import Node from './Node'

export const toJSON = (value) => Array.isArray(value) ? (
  value.map(toJSON)
 ) : value && typeof value === 'object' && ('toJSON' in value) ? (
   value.toJSON()
 ) : value

export default class Collection extends Node {
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
    super()
    this._comments = []
    this.doc = doc
    this.items = []
  }

  addComment (comment) {
    this._comments.push({ comment, before: this.items.length })
  }

  resolveComments () {
    this._comments.forEach(({ comment, before }) => {
      const item = this.items[before]
      if (!item) {
        if (this.comment) this.comment += '\n' + comment
        else this.comment = comment
      } else {
        if (item.commentBefore) item.commentBefore += '\n' + comment
        else item.commentBefore = comment
      }
    })
    delete this._comments
  }

  // overridden in implementations
  toJSON () {
    return null
  }
}
