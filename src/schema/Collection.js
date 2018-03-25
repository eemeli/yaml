import { YAMLSyntaxError } from '../errors'
import Node, { addComment } from './Node'

export const toJSON = (value) => Array.isArray(value) ? (
  value.map(toJSON)
 ) : value && typeof value === 'object' && ('toJSON' in value) ? (
   value.toJSON()
 ) : value

export default class Collection extends Node {
  static maxFlowStringSingleLineLength = 60

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

  toString (options, onComment) {
    const { tags } = this.doc
    const { blockItem, flowChars, indent, inFlow, itemIndent } = options
    const opt = { indent: itemIndent, inFlow, type: null }
    let hasItemWithComment = false
    let hasItemWithNewLine = false
    const items = this.items.map((item, i) => {
      let comment = item && item.comment
      if (comment) hasItemWithComment = true
      let str = tags.stringify(item, opt, () => { comment = null })
      if (!hasItemWithNewLine && str.indexOf('\n') !== -1) hasItemWithNewLine = true
      if (inFlow && i < this.items.length - 1) str += ','
      return addComment(str, opt.indent, comment)
    })
    let str;
    if (items.length === 0) {
      str = flowChars.start + flowChars.end
    } else if (inFlow) {
      const { start, end } = flowChars
      if (hasItemWithComment || hasItemWithNewLine || (
        items.reduce((sum, item) => sum + item.length + 2, 2) > Collection.maxFlowStringSingleLineLength
      )) {
        str = `${start}\n  ${indent}${items.join(`\n  ${indent}`)}\n${indent}${end}`
      } else {
        str = `${start} ${items.join(', ')} ${end}`
      }
    } else {
      str = items.map(blockItem).join(`\n${indent}`)
    }
    if (this.comment) {
      if (!hasItemWithNewLine && str.indexOf('\n') === -1) str = addComment(str, indent, this.comment)
      else str += '\n' + this.comment.replace(/^/gm, `${indent}#`)
      if (onComment) onComment()
    }
    return str
  }
}
