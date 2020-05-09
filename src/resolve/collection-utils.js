import { YAMLSemanticError } from '../errors.js'
import { Type } from '../constants.js'

export function checkFlowCollectionEnd(errors, cst) {
  let char, name
  switch (cst.type) {
    case Type.FLOW_MAP:
      char = '}'
      name = 'flow map'
      break
    case Type.FLOW_SEQ:
      char = ']'
      name = 'flow sequence'
      break
    default:
      errors.push(new YAMLSemanticError(cst, 'Not a flow collection!?'))
      return
  }

  let lastItem
  for (let i = cst.items.length - 1; i >= 0; --i) {
    const item = cst.items[i]
    if (!item || item.type !== Type.COMMENT) {
      lastItem = item
      break
    }
  }

  if (lastItem && lastItem.char !== char) {
    const msg = `Expected ${name} to end with ${char}`
    let err
    if (typeof lastItem.offset === 'number') {
      err = new YAMLSemanticError(cst, msg)
      err.offset = lastItem.offset + 1
    } else {
      err = new YAMLSemanticError(lastItem, msg)
      if (lastItem.range && lastItem.range.end)
        err.offset = lastItem.range.end - lastItem.range.start
    }
    errors.push(err)
  }
}
export function checkFlowCommentSpace(errors, comment) {
  const prev = comment.context.src[comment.range.start - 1]
  if (prev !== '\n' && prev !== '\t' && prev !== ' ') {
    const msg =
      'Comments must be separated from other tokens by white space characters'
    errors.push(new YAMLSemanticError(comment, msg))
  }
}

export function getLongKeyError(source, key) {
  const sk = String(key)
  const k = sk.substr(0, 8) + '...' + sk.substr(-8)
  return new YAMLSemanticError(source, `The "${k}" key is too long`)
}

export function resolveComments(collection, comments) {
  for (const { afterKey, before, comment } of comments) {
    let item = collection.items[before]
    if (!item) {
      if (comment !== undefined) {
        if (collection.comment) collection.comment += '\n' + comment
        else collection.comment = comment
      }
    } else {
      if (afterKey && item.value) item = item.value
      if (comment === undefined) {
        if (afterKey || !item.commentBefore) item.spaceBefore = true
      } else {
        if (item.commentBefore) item.commentBefore += '\n' + comment
        else item.commentBefore = comment
      }
    }
  }
}
