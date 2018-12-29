import addComment from '../addComment'
import Node from './Node'

export default class Collection extends Node {
  static maxFlowStringSingleLineLength = 60

  items = []

  // overridden in implementations
  toJSON() {
    return null
  }

  toString(ctx, { blockItem, flowChars, itemIndent }, onComment, onChompKeep) {
    const { doc, indent } = ctx
    const inFlow =
      (this.type && this.type.substr(0, 4) === 'FLOW') || ctx.inFlow
    if (inFlow) itemIndent += '  '
    ctx = Object.assign({}, ctx, { indent: itemIndent, inFlow, type: null })
    let chompKeep = false
    let hasItemWithNewLine = false
    const nodes = this.items.reduce((nodes, item, i) => {
      let comment
      if (item) {
        if (!chompKeep && item.spaceBefore) {
          hasItemWithNewLine = true
          nodes.push({ type: 'comment', str: '' })
        }
        if (item.commentBefore) {
          hasItemWithNewLine = true
          item.commentBefore.match(/^.*$/gm).forEach(line => {
            nodes.push({ type: 'comment', str: `#${line}` })
          })
        }
        if (item.comment) {
          hasItemWithNewLine = true
          comment = item.comment
        }
        if (item.value && item.value.comment) hasItemWithNewLine = true
      }
      chompKeep = false
      let str = doc.schema.stringify(
        item,
        ctx,
        () => (comment = null),
        () => (chompKeep = true)
      )
      if (!hasItemWithNewLine && str.indexOf('\n') !== -1)
        hasItemWithNewLine = true
      if (inFlow && i < this.items.length - 1) str += ','
      str = addComment(str, itemIndent, comment)
      if (chompKeep && (comment || inFlow)) chompKeep = false
      nodes.push({ type: 'item', str })
      return nodes
    }, [])
    let str
    if (nodes.length === 0) {
      str = flowChars.start + flowChars.end
    } else if (inFlow) {
      const { start, end } = flowChars
      const strings = nodes.map(n => n.str)
      if (
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
      const strings = nodes.map(blockItem)
      str = strings.shift()
      for (const s of strings) str += s ? `\n${indent}${s}` : '\n'
    }
    if (this.comment) {
      str += '\n' + this.comment.replace(/^/gm, `${indent}#`)
      if (onComment) onComment()
    } else if (chompKeep && onChompKeep) onChompKeep()
    return str
  }
}
