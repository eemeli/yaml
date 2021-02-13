import { Collection, Node, Pair, Scalar } from '../ast/index.js'

function visit(node: Node, tags: Record<string, boolean>) {
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

export const listTagNames = (node: Node) => Object.keys(visit(node, {}))
