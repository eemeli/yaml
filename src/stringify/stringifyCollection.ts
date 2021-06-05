import { Collection } from '../nodes/Collection.js'
import { isNode, isPair } from '../nodes/Node.js'
import { stringify, StringifyContext } from './stringify.js'
import { addComment, stringifyComment } from './stringifyComment.js'

type StringifyNode = { comment: boolean; str: string }

interface StringifyCollectionOptions {
  blockItem(node: StringifyNode): string
  flowChars: { start: '{'; end: '}' } | { start: '['; end: ']' }
  itemIndent: string
  onChompKeep?: () => void
  onComment?: () => void
}

export function stringifyCollection(
  { comment, flow, items }: Readonly<Collection>,
  ctx: StringifyContext,
  {
    blockItem,
    flowChars,
    itemIndent,
    onChompKeep,
    onComment
  }: StringifyCollectionOptions
) {
  const { indent, indentStep } = ctx
  const inFlow = flow || ctx.inFlow
  if (inFlow) itemIndent += indentStep
  ctx = Object.assign({}, ctx, { indent: itemIndent, inFlow, type: null })

  let singleLineOutput = true
  let chompKeep = false // flag for the preceding node's status
  const nodes = items.reduce((nodes: StringifyNode[], item, i) => {
    let comment: string | null = null
    if (isNode(item)) {
      if (!chompKeep && item.spaceBefore) nodes.push({ comment: true, str: '' })
      let cb = item.commentBefore
      if (cb && chompKeep) cb = cb.replace(/^\n+/, '')
      if (cb) {
        if (/^\n+$/.test(cb)) cb = cb.substring(1)
        // This match will always succeed on a non-empty string
        for (const line of cb.match(/^.*$/gm) as string[]) {
          const str = line === ' ' ? '#' : line ? `#${line}` : ''
          nodes.push({ comment: true, str })
        }
      }
      if (item.comment) {
        comment = item.comment
        singleLineOutput = false
      }
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null
      if (ik) {
        if (!chompKeep && ik.spaceBefore) nodes.push({ comment: true, str: '' })
        let cb = ik.commentBefore
        if (cb && chompKeep) cb = cb.replace(/^\n+/, '')
        if (cb) {
          if (/^\n+$/.test(cb)) cb = cb.substring(1)
          // This match will always succeed on a non-empty string
          for (const line of cb.match(/^.*$/gm) as string[]) {
            const str = line === ' ' ? '#' : line ? `#${line}` : ''
            nodes.push({ comment: true, str })
          }
        }
        if (ik.comment) singleLineOutput = false
      }

      if (inFlow) {
        const iv = isNode(item.value) ? item.value : null
        if (iv) {
          if (iv.comment) comment = iv.comment
          if (iv.comment || iv.commentBefore) singleLineOutput = false
        } else if (item.value == null && ik && ik.comment) {
          comment = ik.comment
        }
      }
    }

    chompKeep = false
    let str = stringify(
      item,
      ctx,
      () => (comment = null),
      () => (chompKeep = true)
    )
    if (inFlow && i < items.length - 1) str += ','
    str = addComment(str, itemIndent, comment)
    if (chompKeep && (comment || inFlow)) chompKeep = false
    nodes.push({ comment: false, str })
    return nodes
  }, [])

  let str: string
  if (nodes.length === 0) {
    str = flowChars.start + flowChars.end
  } else if (inFlow) {
    const { start, end } = flowChars
    const strings = nodes.map(n => n.str)
    let singleLineLength = 2
    for (const node of nodes) {
      if (node.comment || node.str.includes('\n')) {
        singleLineOutput = false
        break
      }
      singleLineLength += node.str.length + 2
    }
    if (
      !singleLineOutput ||
      singleLineLength > Collection.maxFlowStringSingleLineLength
    ) {
      str = start
      for (const s of strings) {
        str += s ? `\n${indentStep}${indent}${s}` : '\n'
      }
      str += `\n${indent}${end}`
    } else {
      str = `${start} ${strings.join(' ')} ${end}`
    }
  } else {
    const strings = nodes.map(blockItem)
    str = strings.shift() || ''
    for (const s of strings) str += s ? `\n${indent}${s}` : '\n'
  }
  if (comment) {
    str += '\n' + stringifyComment(comment, indent)
    if (onComment) onComment()
  } else if (chompKeep && onChompKeep) onChompKeep()
  return str
}
