import { YAMLSemanticError } from '../errors'

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
  comments.forEach(({ afterKey, before, comment }) => {
    let item = collection.items[before]
    if (!item) {
      if (comment === undefined) {
        collection.spaceAfter = true
      } else {
        if (collection.comment) collection.comment += '\n' + comment
        else collection.comment = comment
        collection.spaceAfter = false
      }
    } else {
      if (afterKey && item.value) item = item.value
      if (comment === undefined) {
        if (!item.commentBefore) item.spaceBefore = true
      } else {
        if (item.commentBefore) item.commentBefore += '\n' + comment
        else item.commentBefore = comment
      }
    }
  })
}
