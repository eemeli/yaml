import { Type } from '../constants.js'
import type { Document } from '../doc/Document.js'
import { isNode, ParsedNode } from '../nodes/Node.js'
import { Scalar } from '../nodes/Scalar.js'
import type { YAMLMap } from '../nodes/YAMLMap.js'
import type { YAMLSeq } from '../nodes/YAMLSeq.js'
import type {
  BlockMap,
  BlockSequence,
  FlowCollection
} from '../parse/tokens.js'
import { CollectionTag } from '../tags/types.js'
import type { ComposeNode } from './compose-node.js'
import { resolveBlockMap } from './resolve-block-map.js'
import { resolveBlockSeq } from './resolve-block-seq.js'
import { resolveFlowCollection } from './resolve-flow-collection.js'

export function composeCollection(
  CN: ComposeNode,
  doc: Document.Parsed,
  token: BlockMap | BlockSequence | FlowCollection,
  anchor: string | null,
  tagName: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  let coll: YAMLMap.Parsed | YAMLSeq.Parsed
  switch (token.type) {
    case 'block-map': {
      coll = resolveBlockMap(CN, doc, token, anchor, onError)
      break
    }
    case 'block-seq': {
      coll = resolveBlockSeq(CN, doc, token, anchor, onError)
      break
    }
    case 'flow-collection': {
      coll = resolveFlowCollection(CN, doc, token, anchor, onError)
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

  let expType: 'map' | 'seq' // | null = null
  switch (coll.type) {
    case Type.FLOW_MAP:
    case Type.MAP:
      expType = 'map'
      break
    case Type.FLOW_SEQ:
    case Type.SEQ:
      expType = 'seq'
      break
    default:
      onError(coll.range[0], `Unexpected collection type: ${coll.type}`)
      coll.tag = tagName
      return coll
  }

  let tag = doc.schema.tags.find(
    t => t.collection === expType && t.tag === tagName
  ) as CollectionTag | undefined
  if (!tag) {
    const kt = doc.schema.knownTags[tagName]
    if (kt && kt.collection === expType) {
      doc.schema.tags.push(Object.assign({}, kt, { default: false }))
      tag = kt
    } else {
      onError(coll.range[0], `Unresolved tag: ${tagName}`, true)
      coll.tag = tagName
      return coll
    }
  }

  const res = tag.resolve(coll, msg => onError(coll.range[0], msg))
  const node = isNode(res)
    ? (res as ParsedNode)
    : (new Scalar(res) as Scalar.Parsed)
  node.range = coll.range
  node.tag = tagName
  if (tag?.format) (node as Scalar).format = tag.format
  if (anchor && node !== coll) {
    // FIXME: handle anchor for non-failsafe collections
  }
  return node
}
