export const toJSON = (value) => (
  value &&
  typeof value === 'object' &&
  ('toJSON' in value)
) ? value.toJSON() : value

export class Pair {
  constructor (key, value = null) {
    this.key = key
    this.value = value
  }

  toJSON () {
    const pair = {}
    pair[this.stringKey] = toJSON(this.value)
    return pair
  }

  get stringKey () {
    const key = toJSON(this.key)
    if (typeof key === 'object') try { return JSON.stringify(key) }
    catch (e) { /* should not happen, but let's ignore in any case */ }
    return String(key)
  }
}

export class Comment {
  constructor (comment, before) {
    this.before = before
    this.comment = comment
  }
}

export default class Collection {
  constructor () {
    this.comments = [] // TODO: include collection & item comments
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
