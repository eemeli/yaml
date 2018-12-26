import addComment from '../addComment'
import Node from './Node'

export default class Collection extends Node {
  static maxFlowStringSingleLineLength = 60

  items = []

  // overridden in implementations
  toJSON() {
    return null
  }

  toString(ctx, { blockItem, flowChars, itemIndent }, onComment) {
    const { doc, indent } = ctx
    const inFlow =
      (this.type && this.type.substr(0, 4) === 'FLOW') || ctx.inFlow
    if (inFlow) itemIndent += '  '
    ctx = Object.assign({}, ctx, { indent: itemIndent, inFlow, type: null })
    let hasItemWithComment = false
    let hasItemWithNewLine = false
    const nodes = this.items.reduce((nodes, item, i) => {
      let comment
      if (item) {
        if (item.spaceBefore) {
          hasItemWithComment = true
          nodes.push({ type: 'comment', str: '' })
        }
        if (item.commentBefore) {
          hasItemWithComment = true
          item.commentBefore.match(/^.*$/gm).forEach(line => {
            nodes.push({ type: 'comment', str: `#${line}` })
          })
        }
        if (item.comment) {
          hasItemWithComment = true
          comment = item.comment
        }
      }
      let str = doc.schema.stringify(item, ctx, () => {
        comment = null
      })
      if (!hasItemWithNewLine && str.indexOf('\n') !== -1)
        hasItemWithNewLine = true
      if (inFlow && i < this.items.length - 1) str += ','
      str = addComment(str, itemIndent, comment)
      nodes.push({ type: 'item', str })
      return nodes
    }, [])
    let str
    if (nodes.length === 0) {
      str = flowChars.start + flowChars.end
    } else if (inFlow) {
      const { start, end } = flowChars
      const strings = nodes.map(({ str }) => str)
      if (
        hasItemWithComment ||
        hasItemWithNewLine ||
        strings.reduce((sum, str) => sum + str.length + 2, 2) >
          Collection.maxFlowStringSingleLineLength
      ) {
        str = start
        for (const s of strings) {
          str += s ? `\n  ${indent}${s}` : '\n'
        }
        str += `\n${indent}${end}`
      } else {
        str = `${start} ${strings.join(' ')} ${end}`
      }
    } else {
      str = nodes.map(blockItem).join(`\n${indent}`)
    }
    if (this.comment) {
      str += '\n' + this.comment.replace(/^/gm, `${indent}#`)
      if (onComment) onComment()
    }
    if (this.spaceAfter) str += '\n'
    return str
  }
}
