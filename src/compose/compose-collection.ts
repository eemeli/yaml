import { isMap, isNode } from '../nodes/identity.js'
import type { ParsedNode } from '../nodes/Node.js'
import { Scalar } from '../nodes/Scalar.js'
import type { YAMLMap } from '../nodes/YAMLMap.js'
import type { YAMLSeq } from '../nodes/YAMLSeq.js'
import type {
  BlockMap,
  BlockSequence,
  FlowCollection,
  SourceToken
} from '../parse/cst.js'
import { CollectionTag } from '../schema/types.js'
import type { ComposeContext, ComposeNode } from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveBlockMap } from './resolve-block-map.js'
import { resolveBlockSeq } from './resolve-block-seq.js'
import { resolveFlowCollection } from './resolve-flow-collection.js'

export function composeCollection(
  CN: ComposeNode,
  ctx: ComposeContext,
  token: BlockMap | BlockSequence | FlowCollection,
  tagToken: SourceToken | null,
  onError: ComposeErrorHandler
) {
  let coll: YAMLMap.Parsed | YAMLSeq.Parsed
  switch (token.type) {
    case 'block-map': {
      coll = resolveBlockMap(CN, ctx, token, onError)
      break
    }
    case 'block-seq': {
      coll = resolveBlockSeq(CN, ctx, token, onError)
      break
    }
    case 'flow-collection': {
      coll = resolveFlowCollection(CN, ctx, token, onError)
      break
    }
  }

  if (!tagToken) return coll
  const tagName = ctx.directives.tagName(tagToken.source, msg =>
    onError(tagToken, 'TAG_RESOLVE_FAILED', msg)
  )
  if (!tagName) return coll

  // Cast needed due to: https://github.com/Microsoft/TypeScript/issues/3841
  const Coll = coll.constructor as typeof YAMLMap | typeof YAMLSeq
  if (tagName === '!' || tagName === Coll.tagName) {
    coll.tag = Coll.tagName
    return coll
  }

  const expType = isMap(coll) ? 'map' : 'seq'
  let tag = ctx.schema.tags.find(
    t => t.collection === expType && t.tag === tagName
  ) as CollectionTag | undefined
  if (!tag) {
    const kt = ctx.schema.knownTags[tagName]
    if (kt && kt.collection === expType) {
      ctx.schema.tags.push(Object.assign({}, kt, { default: false }))
      tag = kt
    } else {
      onError(
        tagToken,
        'TAG_RESOLVE_FAILED',
        `Unresolved tag: ${tagName}`,
        true
      )
      coll.tag = tagName
      return coll
    }
  }

  const res = tag.resolve(
    coll,
    msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg),
    ctx.options
  )
  const node = isNode(res)
    ? (res as ParsedNode)
    : (new Scalar(res) as Scalar.Parsed)
  node.range = coll.range
  node.tag = tagName
  if (tag?.format) (node as Scalar).format = tag.format
  return node
}
