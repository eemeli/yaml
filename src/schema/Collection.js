import { YAMLSyntaxError } from '../errors'

export const toJSON = (value) => Array.isArray(value) ? (
  value.map(toJSON)
 ) : value && typeof value === 'object' && ('toJSON' in value) ? (
   value.toJSON()
 ) : value

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
