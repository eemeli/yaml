import { isCollection } from '../nodes/identity.ts'
import type { Pair } from '../nodes/Pair.ts'
import { Scalar } from '../nodes/Scalar.ts'
import { YAMLSeq } from '../nodes/YAMLSeq.ts'
import type { StringifyContext } from './stringify.ts'
import { stringify } from './stringify.ts'
import { indentComment, lineComment } from './stringifyComment.ts'

export function stringifyPair(
  { key, value }: Readonly<Pair>,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string {
  const {
    indent,
    indentStep,
    noValues,
    options: { commentString, indentSeq, simpleKeys }
  } = ctx
  if (simpleKeys) {
    if (key.comment) {
      throw new Error('With simple keys, key nodes cannot have comments')
    }
    if (isCollection(key)) {
      const msg = 'With simple keys, collection cannot be used as a key value'
      throw new Error(msg)
    }
  }
  let explicitKey =
    !simpleKeys &&
    (!(key instanceof Scalar) ||
      key.type === Scalar.BLOCK_FOLDED ||
      key.type === Scalar.BLOCK_LITERAL)

  ctx = {
    ...ctx,
    implicitKey: !explicitKey && (simpleKeys || !noValues),
    indent: indent + indentStep,
    noValues: false
  }
  let keyComment = key.comment
  let keyCommentDone = false
  let chompKeep = false
  let str = stringify(
    key,
    ctx,
    () => (keyCommentDone = true),
    () => (chompKeep = true)
  )

  if (!explicitKey && !ctx.inFlow && str.length > 1024) {
    if (simpleKeys)
      throw new Error(
        'With simple keys, single line scalar must not span more than 1024 characters'
      )
    explicitKey = true
  }

  if (ctx.inFlow) {
    if (noValues || value == null) {
      if (keyCommentDone && onComment) onComment()
      return str === ''
        ? '?'
        : explicitKey
          ? `? ${str}`
          : noValues
            ? str
            : `${str}:`
    }
  } else if ((noValues && !simpleKeys) || (value == null && explicitKey)) {
    str = `? ${str}`
    if (keyComment && !keyCommentDone) {
      str += lineComment(str, ctx.indent, commentString(keyComment))
    } else if (chompKeep && onChompKeep) onChompKeep()
    return str
  }

  if (keyCommentDone) keyComment = null
  if (explicitKey) {
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment))
    str = `? ${str}\n${indent}:`
  } else {
    str = `${str}:`
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment))
  }

  let vsb, vcb, valueComment
  if (value) {
    vsb = !!value.spaceBefore
    vcb = value.commentBefore
    valueComment = value.comment
  } else {
    vsb = false
    vcb = null
    valueComment = null
  }
  ctx.implicitKey = false
  if (!explicitKey && !keyComment && value instanceof Scalar)
    ctx.indentAtStart = str.length + 1
  chompKeep = false
  if (
    !indentSeq &&
    indentStep.length >= 2 &&
    !ctx.inFlow &&
    !explicitKey &&
    value instanceof YAMLSeq &&
    !value.flow &&
    !value.tag &&
    !value.anchor
  ) {
    // If indentSeq === false, consider '- ' as part of indentation where possible
    ctx.indent = ctx.indent.substring(2)
  }

  let valueCommentDone = false
  const valueStr = stringify(
    value,
    ctx,
    () => (valueCommentDone = true),
    () => (chompKeep = true)
  )
  let ws = ' '
  if (keyComment || vsb || vcb) {
    ws = vsb ? '\n' : ''
    if (vcb) {
      const cs = commentString(vcb)
      ws += `\n${indentComment(cs, ctx.indent)}`
    }
    if (valueStr === '' && !ctx.inFlow) {
      if (ws === '\n' && valueComment) ws = '\n\n'
    } else {
      ws += `\n${ctx.indent}`
    }
  } else if (!explicitKey && isCollection(value)) {
    const vs0 = valueStr[0]
    const nl0 = valueStr.indexOf('\n')
    const hasNewline = nl0 !== -1
    const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0
    if (hasNewline || !flow) {
      let hasPropsLine = false
      if (hasNewline && (vs0 === '&' || vs0 === '!')) {
        let sp0 = valueStr.indexOf(' ')
        if (
          vs0 === '&' &&
          sp0 !== -1 &&
          sp0 < nl0 &&
          valueStr[sp0 + 1] === '!'
        ) {
          sp0 = valueStr.indexOf(' ', sp0 + 1)
        }
        if (sp0 === -1 || nl0 < sp0) hasPropsLine = true
      }
      if (!hasPropsLine) ws = `\n${ctx.indent}`
    }
  } else if (valueStr === '' || valueStr[0] === '\n') {
    ws = ''
  }
  str += ws + valueStr

  if (ctx.inFlow) {
    if (valueCommentDone && onComment) onComment()
  } else if (valueComment && !valueCommentDone) {
    str += lineComment(str, ctx.indent, commentString(valueComment))
  } else if (chompKeep && onChompKeep) {
    onChompKeep()
  }

  return str
}
