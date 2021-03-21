import { isCollection, isScalar, Node } from '../nodes/Node.js'
import type { Scalar } from '../nodes/Scalar.js'
import type { YAMLMap } from '../nodes/YAMLMap.js'
import type { YAMLSeq } from '../nodes/YAMLSeq.js'
import { visit } from '../visit.js'
import { CreateNodeContext } from './createNode.js'
import type { Document } from './Document.js'

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

export function anchorNames(root: Document | Node) {
  const anchors = new Set<string>()
  const addNode = (_key: unknown, node: Scalar | YAMLMap | YAMLSeq) => {
    if (node.anchor) anchors.add(node.anchor)
  }
  visit(root, { Scalar: addNode, Map: addNode, Seq: addNode })
  return anchors
}

/**
 * Find a new anchor name with the given `prefix` and a one-indexed suffix.
 *
 * The second argument may either be a YAML Document, or a Set of strings
 * against which generated anchors are tested; this is intended to allow for
 * caching, should multiple new anchors be needed within a single operation.
 */
export function findNewAnchor(prefix: string, doc: Document): string
export function findNewAnchor(prefix: string, cache: Set<string>): string
export function findNewAnchor(prefix: string, cache: Document | Set<string>) {
  const exclude = cache instanceof Set ? cache : anchorNames(cache)
  for (let i = 1; true; ++i) {
    const name = `${prefix}${i}`
    if (!exclude.has(name)) return name
  }
}

export function createNodeAnchors(doc: Document, prefix: string) {
  const aliasObjects: unknown[] = []
  const sourceObjects: CreateNodeContext['sourceObjects'] = new Map()
  let prevAnchors: Set<string> | null = null

  return {
    onAnchor(source: unknown) {
      aliasObjects.push(source)
      if (!prevAnchors) prevAnchors = anchorNames(doc)
      const anchor = findNewAnchor(prefix, prevAnchors)
      prevAnchors.add(anchor)
      return anchor
    },

    /**
     * With circular references, the source node is only resolved after all
     * of its child nodes are. This is why anchors are set only after all of
     * the nodes have been created.
     */
    setAnchors() {
      for (const source of aliasObjects) {
        const ref = sourceObjects.get(source)
        if (
          typeof ref === 'object' &&
          ref.anchor &&
          (isScalar(ref.node) || isCollection(ref.node))
        ) {
          ref.node.anchor = ref.anchor
        } else {
          const error = new Error(
            'Failed to resolve repeated object (this should not happen)'
          ) as Error & { source: unknown }
          error.source = source
          throw error
        }
      }
    },

    sourceObjects
  }
}
