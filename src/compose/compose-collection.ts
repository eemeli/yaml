import { Node, Scalar, YAMLMap, YAMLSeq } from '../ast/index.js'
import type { Document } from '../doc/Document.js'
import type { BlockMap, BlockSequence, FlowCollection } from '../parse/tokens.js'
import { resolveBlockMap } from './resolve-block-map.js'
import { resolveBlockSeq } from './resolve-block-seq.js'
import { resolveFlowCollection } from './resolve-flow-collection.js'

export function composeCollection(
  doc: Document.Parsed,
  token: BlockMap | BlockSequence | FlowCollection,
  anchor: string | null,
  tagName: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  let coll: YAMLMap.Parsed | YAMLSeq.Parsed
  switch (token.type) {
    case 'block-map': {
      coll = resolveBlockMap(doc, token, anchor, onError)
      break
    }
    case 'block-seq': {
      coll = resolveBlockSeq(doc, token, anchor, onError)
      break
    }
    case 'flow-collection': {
      coll = resolveFlowCollection(doc, token, anchor, onError)
      break
    }
  }

  if (!tagName) return coll

  // Cast needed due to: https://github.com/Microsoft/TypeScript/issues/3841
  const Coll = coll.constructor as typeof YAMLMap | typeof YAMLSeq
  if (tagName === '!' || tagName === Coll.tagName) {
    coll.tag = Coll.tagName
    return coll
  }

  let tag = doc.schema.tags.find(t => t.tag === tagName)
  if (!tag) {
    const kt = doc.schema.knownTags[tagName]
    if (kt) {
      doc.schema.tags.push(Object.assign({}, kt, { default: false }))
      tag = kt
    } else {
      onError(coll.range[0], `Unresolved tag: ${tagName}`, true)
      coll.tag = tagName
      return coll
    }
  }

  const res = tag.resolve(coll, msg => onError(coll.range[0], msg))
  const node =
    res instanceof Node
      ? (res as Node.Parsed)
      : (new Scalar(res) as Scalar.Parsed)
  node.range = coll.range
  node.tag = tagName
  if (tag?.format) (node as Scalar).format = tag.format
  if (anchor && node !== coll) {
    // FIXME: handle anchor for non-failsafe collections
  }
  return node
}
