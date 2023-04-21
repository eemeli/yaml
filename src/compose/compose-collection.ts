import { isNode } from '../nodes/identity.js'
import type { ParsedNode } from '../nodes/Node.js'
import { Scalar } from '../nodes/Scalar.js'
import { YAMLMap } from '../nodes/YAMLMap.js'
import { YAMLSeq } from '../nodes/YAMLSeq.js'
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

function resolveCollection(
  CN: ComposeNode,
  ctx: ComposeContext,
  token: BlockMap | BlockSequence | FlowCollection,
  onError: ComposeErrorHandler,
  tagName: string | null,
  tag?: CollectionTag
) {
  const coll =
    token.type === 'block-map'
      ? resolveBlockMap(CN, ctx, token, onError, tag)
      : token.type === 'block-seq'
      ? resolveBlockSeq(CN, ctx, token, onError, tag)
      : resolveFlowCollection(CN, ctx, token, onError, tag)

  const Coll = coll.constructor as typeof YAMLMap | typeof YAMLSeq

  // If we got a tagName matching the class, or the tag name is '!',
  // then use the tagName from the node class used to create it.
  if (tagName === '!' || tagName === Coll.tagName) {
    coll.tag = Coll.tagName
    return coll
  } else if (tagName) {
    coll.tag = tagName
  }

  return coll
}

export function composeCollection(
  CN: ComposeNode,
  ctx: ComposeContext,
  token: BlockMap | BlockSequence | FlowCollection,
  tagToken: SourceToken | null,
  onError: ComposeErrorHandler
) {
  const tagName: string | null = !tagToken
    ? null
    : ctx.directives.tagName(tagToken.source, msg =>
        onError(tagToken, 'TAG_RESOLVE_FAILED', msg)
      )

  let coll: YAMLMap.Parsed | YAMLSeq.Parsed
  let expType: 'map' | 'seq' | undefined =
    token.type === 'block-map'
      ? 'map'
      : token.type === 'block-seq'
      ? 'seq'
      : token.type === 'flow-collection'
      ? token.start.source === '{'
        ? 'map'
        : 'seq'
      : undefined

  if (!expType) {
    onError(
      token,
      'IMPOSSIBLE',
      'could not determine collection expression type',
      true
    )
  }

  // shortcut: check if it's a generic YAMLMap or YAMLSeq
  // before jumping into the custom tag logic.
  if (
    !tagToken ||
    !tagName ||
    tagName === '!' ||
    (tagName === YAMLMap.tagName && expType === 'map') ||
    (tagName === YAMLSeq.tagName && expType === 'seq') ||
    !expType
  ) {
    return resolveCollection(CN, ctx, token, onError, tagName)
  }

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
      return resolveCollection(CN, ctx, token, onError, tagName)
    }
  }

  coll = resolveCollection(CN, ctx, token, onError, tagName, tag)

  const res =
    tag.resolve?.(
      coll,
      msg => onError(tagToken, 'TAG_RESOLVE_FAILED', msg),
      ctx.options
    ) ?? coll

  const node = isNode(res)
    ? (res as ParsedNode)
    : (new Scalar(res) as Scalar.Parsed)
  node.range = coll.range
  node.tag = tagName
  if (tag?.format) (node as Scalar).format = tag.format
  return node
}
