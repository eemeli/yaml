import { Collection } from '../nodes/Collection.js'
import { isNode, isPair } from '../nodes/identity.js'
import { stringify, StringifyContext } from './stringify.js'
import { indentComment, lineComment } from './stringifyComment.js'

interface StringifyCollectionOptions {
  blockItemPrefix: string
  flowChars: { start: '{'; end: '}' } | { start: '['; end: ']' }
  itemIndent: string
  onChompKeep?: () => void
  onComment?: () => void
}

export function stringifyCollection(
  collection: Readonly<Collection>,
  ctx: StringifyContext,
  options: StringifyCollectionOptions
) {
  const flow = ctx.inFlow ?? collection.flow
  const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection
  return stringify(collection, ctx, options)
}

function stringifyBlockCollection(
  { comment, items }: Readonly<Collection>,
  ctx: StringifyContext,
  {
    blockItemPrefix,
    flowChars,
    itemIndent,
    onChompKeep,
    onComment
  }: StringifyCollectionOptions
) {
  const {
    indent,
    options: { commentString }
  } = ctx
  const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null })

  let chompKeep = false // flag for the preceding node's status
  const lines: string[] = []
  for (let i = 0; i < items.length; ++i) {
    const item = items[i]
    let comment: string | null = null
    if (isNode(item)) {
      if (!chompKeep && item.spaceBefore) lines.push('')
      addCommentBefore(ctx, lines, item.commentBefore, chompKeep)
      if (item.comment) comment = item.comment
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null
      if (ik) {
        if (!chompKeep && ik.spaceBefore) lines.push('')
        addCommentBefore(ctx, lines, ik.commentBefore, chompKeep)
      }
    }

    chompKeep = false
    let str = stringify(
      item,
      itemCtx,
      () => (comment = null),
      () => (chompKeep = true)
    )
    if (comment) str += lineComment(str, itemIndent, commentString(comment))
    if (chompKeep && comment) chompKeep = false
    lines.push(blockItemPrefix + str)
  }

  let str: string
  if (lines.length === 0) {
    str = flowChars.start + flowChars.end
  } else {
    str = lines[0]
    for (let i = 1; i < lines.length; ++i) {
      const line = lines[i]
      str += line ? `\n${indent}${line}` : '\n'
    }
  }

  if (comment) {
    str += '\n' + indentComment(commentString(comment), indent)
    if (onComment) onComment()
  } else if (chompKeep && onChompKeep) onChompKeep()

  return str
}

function stringifyFlowCollection(
  { comment, items }: Readonly<Collection>,
  ctx: StringifyContext,
  { flowChars, itemIndent, onComment }: StringifyCollectionOptions
) {
  const {
    indent,
    indentStep,
    flowCollectionPadding: fcPadding,
    options: { commentString }
  } = ctx
  itemIndent += indentStep
  const itemCtx = Object.assign({}, ctx, {
    indent: itemIndent,
    inFlow: true,
    type: null
  })

  let reqNewline = false
  let linesAtValue = 0
  const lines: string[] = []
  for (let i = 0; i < items.length; ++i) {
    const item = items[i]
    let comment: string | null = null
    if (isNode(item)) {
      if (item.spaceBefore) lines.push('')
      addCommentBefore(ctx, lines, item.commentBefore, false)
      if (item.comment) comment = item.comment
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null
      if (ik) {
        if (ik.spaceBefore) lines.push('')
        addCommentBefore(ctx, lines, ik.commentBefore, false)
        if (ik.comment) reqNewline = true
      }

      const iv = isNode(item.value) ? item.value : null
      if (iv) {
        if (iv.comment) comment = iv.comment
        if (iv.commentBefore) reqNewline = true
      } else if (item.value == null && ik?.comment) {
        comment = ik.comment
      }
    }

    if (comment) reqNewline = true
    let str = stringify(item, itemCtx, () => (comment = null))
    if (i < items.length - 1) str += ','
    if (comment) str += lineComment(str, itemIndent, commentString(comment))
    if (!reqNewline && (lines.length > linesAtValue || str.includes('\n')))
      reqNewline = true
    lines.push(str)
    linesAtValue = lines.length
  }

  let str: string
  const { start, end } = flowChars
  if (lines.length === 0) {
    str = start + end
  } else {
    if (!reqNewline) {
      const len = lines.reduce((sum, line) => sum + line.length + 2, 2)
      reqNewline = len > Collection.maxFlowStringSingleLineLength
    }
    if (reqNewline) {
      str = start
      for (const line of lines)
        str += line ? `\n${indentStep}${indent}${line}` : '\n'
      str += `\n${indent}${end}`
    } else {
      str = `${start}${fcPadding}${lines.join(' ')}${fcPadding}${end}`
    }
  }

  if (comment) {
    str += lineComment(str, indent, commentString(comment))
    if (onComment) onComment()
  }
  return str
}

function addCommentBefore(
  { indent, options: { commentString } }: StringifyContext,
  lines: string[],
  comment: string | null | undefined,
  chompKeep: boolean
) {
  if (comment && chompKeep) comment = comment.replace(/^\n+/, '')
  if (comment) {
    const ic = indentComment(commentString(comment), indent)
    lines.push(ic.trimStart()) // Avoid double indent on first line
  }
}
