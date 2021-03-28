import { isCollection, isNode, isScalar, isSeq } from '../nodes/Node.js'
import type { Pair } from '../nodes/Pair.js'
import { Scalar } from '../nodes/Scalar.js'
import { addComment } from './addComment.js'
import { stringify, StringifyContext } from './stringify.js'

export function stringifyPair(
  { key, value }: Readonly<Pair>,
  ctx: StringifyContext,
  _onComment?: () => void,
  onChompKeep?: () => void
) {
  const {
    allNullValues,
    doc,
    indent,
    indentStep,
    options: { indentSeq, simpleKeys }
  } = ctx
  let keyComment = (isNode(key) && key.comment) || null
  if (simpleKeys) {
    if (keyComment) {
      throw new Error('With simple keys, key nodes cannot have comments')
    }
    if (isCollection(key)) {
      const msg = 'With simple keys, collection cannot be used as a key value'
      throw new Error(msg)
    }
  }
  let explicitKey =
    !simpleKeys &&
    (!key ||
      (keyComment && value == null && !ctx.inFlow) ||
      isCollection(key) ||
      (isScalar(key)
        ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL
        : typeof key === 'object'))

  ctx = Object.assign({}, ctx, {
    allNullValues: false,
    implicitKey: !explicitKey && (simpleKeys || !allNullValues),
    indent: indent + indentStep
  })
  let chompKeep = false
  let str = stringify(
    key,
    ctx,
    () => (keyComment = null),
    () => (chompKeep = true)
  )

  if (!explicitKey && !ctx.inFlow && str.length > 1024) {
    if (simpleKeys)
      throw new Error(
        'With simple keys, single line scalar must not span more than 1024 characters'
      )
    explicitKey = true
  }

  if (
    (allNullValues && (!simpleKeys || ctx.inFlow)) ||
    (value == null && (explicitKey || ctx.inFlow))
  ) {
    str = addComment(str, ctx.indent, keyComment)
    if (chompKeep && !keyComment && onChompKeep) onChompKeep()
    return ctx.inFlow && !explicitKey ? str : `? ${str}`
  }

  str = explicitKey
    ? `? ${addComment(str, ctx.indent, keyComment)}\n${indent}:`
    : addComment(`${str}:`, ctx.indent, keyComment)

  let vcb = ''
  let valueComment = null
  if (isNode(value)) {
    if (value.spaceBefore) vcb = '\n'
    if (value.commentBefore) {
      const cs = value.commentBefore.replace(/^/gm, `${ctx.indent}#`)
      vcb += `\n${cs}`
    }
    valueComment = value.comment
  } else if (value && typeof value === 'object') {
    value = doc.createNode(value)
  }
  ctx.implicitKey = false
  if (!explicitKey && !keyComment && isScalar(value))
    ctx.indentAtStart = str.length + 1
  chompKeep = false
  if (
    !indentSeq &&
    indentStep.length >= 2 &&
    !ctx.inFlow &&
    !explicitKey &&
    isSeq(value) &&
    !value.flow &&
    !value.tag &&
    !value.anchor
  ) {
    // If indentSeq === false, consider '- ' as part of indentation where possible
    ctx.indent = ctx.indent.substr(2)
  }
  const valueStr = stringify(
    value,
    ctx,
    () => (valueComment = null),
    () => (chompKeep = true)
  )
  let ws = ' '
  if (vcb || keyComment) {
    ws = `${vcb}\n${ctx.indent}`
  } else if (!explicitKey && isCollection(value)) {
    const flow = valueStr[0] === '[' || valueStr[0] === '{'
    if (!flow || valueStr.includes('\n')) ws = `\n${ctx.indent}`
  } else if (valueStr[0] === '\n') ws = ''
  if (chompKeep && !valueComment && onChompKeep) onChompKeep()
  return addComment(str + ws + valueStr, ctx.indent, valueComment)
}
