import type { Node } from '../nodes/Node.ts'
import { visit } from '../visit.ts'
import type { Document, DocValue } from './Document.ts'

/**
 * Verify that the input string is a valid anchor.
 *
 * Will throw on errors.
 */
export function anchorIsValid(anchor: string): true {
  if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
    const sa = JSON.stringify(anchor)
    const msg = `Anchor must not contain whitespace or control characters: ${sa}`
    throw new Error(msg)
  }
  return true
}

export function anchorNames(
  root: Document<DocValue, boolean> | Node
): Set<string> {
  const anchors = new Set<string>()
  visit(root, {
    Value(_key, node) {
      if (node.anchor) anchors.add(node.anchor)
    }
  })
  return anchors
}

/** Find a new anchor name with the given `prefix` and a one-indexed suffix. */
export function findNewAnchor(prefix: string, exclude: Set<string>): string {
  for (let i = 1; true; ++i) {
    const name = `${prefix}${i}`
    if (!exclude.has(name)) return name
  }
}
