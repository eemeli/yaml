import { YAMLSemanticError } from '../errors'

export function checkKeyLength(errors, node, itemIdx, key, keyStart) {
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
    const k = String(key).substr(0, 8) + '...' + String(key).substr(-8)
    errors.push(new YAMLSemanticError(node, `The "${k}" key is too long`))
  }
}

export function resolveComments(collection, comments) {
  comments.forEach(({ comment, before }) => {
    const item = collection.items[before]
    if (!item) {
      if (collection.comment) collection.comment += '\n' + comment
      else collection.comment = comment
    } else {
      if (item.commentBefore) item.commentBefore += '\n' + comment
      else item.commentBefore = comment
    }
  })
}
