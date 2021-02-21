import { Collection, Node, Pair, Scalar } from '../ast/index.js'

function visit(node: unknown, tags: Record<string, boolean>) {
  if (node && typeof node === 'object') {
    if (node instanceof Collection) {
      const { tag } = node
      if (tag) tags[tag] = true
      node.items.forEach(n => visit(n, tags))
    } else if (node instanceof Pair) {
      visit(node.key, tags)
      visit(node.value, tags)
    } else if (node instanceof Scalar) {
      const { tag } = node
      if (tag) tags[tag] = true
    }
  }
  return tags
}

export const listTagNames = (node: Node) => Object.keys(visit(node, {}))
