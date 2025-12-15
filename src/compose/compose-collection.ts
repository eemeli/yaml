import { isNode } from '../nodes/identity.ts'
import type { ParsedNode } from '../nodes/Node.ts'
import { Scalar } from '../nodes/Scalar.ts'
import { YAMLMap } from '../nodes/YAMLMap.ts'
import { YAMLSeq } from '../nodes/YAMLSeq.ts'
import type {
  BlockMap,
  BlockSequence,
  FlowCollection,
  SourceToken
} from '../parse/cst.ts'
import type { CollectionTag } from '../schema/types.ts'
import type { ComposeContext, ComposeNode } from './compose-node.ts'
import type { ComposeErrorHandler } from './composer.ts'
import { resolveBlockMap } from './resolve-block-map.ts'
import { resolveBlockSeq } from './resolve-block-seq.ts'
import { resolveFlowCollection } from './resolve-flow-collection.ts'

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
  }
  if (tagName) coll.tag = tagName
  return coll
}

interface Props {
  anchor: SourceToken | null
  tag: SourceToken | null
  newlineAfterProp: SourceToken | null
}

export function composeCollection(
  CN: ComposeNode,
  ctx: ComposeContext,
  token: BlockMap | BlockSequence | FlowCollection,
  props: Props,
  onError: ComposeErrorHandler
): ParsedNode {
  const tagToken = props.tag
  const tagName: string | null = !tagToken
    ? null
    : ctx.directives.tagName(tagToken.source, msg =>
        onError(tagToken, 'TAG_RESOLVE_FAILED', msg)
      )

  if (token.type === 'block-seq') {
    const { anchor, newlineAfterProp: nl } = props
    const lastProp =
      anchor && tagToken
        ? anchor.offset > tagToken.offset
          ? anchor
          : tagToken
        : (anchor ?? tagToken)
    if (lastProp && (!nl || nl.offset < lastProp.offset)) {
      const message = 'Missing newline after block sequence props'
      onError(lastProp, 'MISSING_CHAR', message)
    }
  }

  const expType: 'map' | 'seq' =
    token.type === 'block-map'
      ? 'map'
      : token.type === 'block-seq'
        ? 'seq'
        : token.start.source === '{'
          ? 'map'
          : 'seq'

  // shortcut: check if it's a generic YAMLMap or YAMLSeq
  // before jumping into the custom tag logic.
  if (
    !tagToken ||
    !tagName ||
    tagName === '!' ||
    (tagName === YAMLMap.tagName && expType === 'map') ||
    (tagName === YAMLSeq.tagName && expType === 'seq')
  ) {
    return resolveCollection(CN, ctx, token, onError, tagName)
  }

  let tag = ctx.schema.tags.find(
    t => t.tag === tagName && t.collection === expType
  ) as CollectionTag | undefined

  if (!tag) {
    const kt = ctx.schema.knownTags[tagName]
    if (kt?.collection === expType) {
      ctx.schema.tags.push(Object.assign({}, kt, { default: false }))
      tag = kt
    } else {
      if (kt) {
        onError(
          tagToken,
          'BAD_COLLECTION_TYPE',
          `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? 'scalar'}`,
          true
        )
      } else {
        onError(
          tagToken,
          'TAG_RESOLVE_FAILED',
          `Unresolved tag: ${tagName}`,
          true
        )
      }
      return resolveCollection(CN, ctx, token, onError, tagName)
    }
  }

  const coll = resolveCollection(CN, ctx, token, onError, tagName, tag)

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
