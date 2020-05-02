import { Collection } from '../schema/Collection'
import { Pair } from '../schema/Pair'
import { Scalar } from '../schema/Scalar'

const visit = (node, tags) => {
  if (node && typeof node === 'object') {
    const { tag } = node
    if (node instanceof Collection) {
      if (tag) tags[tag] = true
      node.items.forEach(n => visit(n, tags))
    } else if (node instanceof Pair) {
      visit(node.key, tags)
      visit(node.value, tags)
    } else if (node instanceof Scalar) {
      if (tag) tags[tag] = true
    }
  }
  return tags
}

export const listTagNames = node => Object.keys(visit(node, {}))
