import { YAMLSemanticError } from '../errors'
import { Type } from '../constants'

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

export function checkKeyLength(errors, node, itemIdx, key, keyStart) {
  if (!key || typeof keyStart !== 'number') return
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
    const k = String(key).substr(0, 8) + '...' + String(key).substr(-8)
    errors.push(new YAMLSemanticError(node, `The "${k}" key is too long`))
  }
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
