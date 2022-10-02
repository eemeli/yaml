import type { Directives } from '../doc/directives.js'
import { Alias } from '../nodes/Alias.js'
import type { ParsedNode } from '../nodes/Node.js'
import type { ParseOptions } from '../options.js'
import type { FlowScalar, SourceToken, Token } from '../parse/cst.js'
import type { Schema } from '../schema/Schema.js'
import { composeCollection } from './compose-collection.js'
import { composeScalar } from './compose-scalar.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveEnd } from './resolve-end.js'
import { emptyScalarPosition } from './util-empty-scalar-position.js'

export interface ComposeContext {
  atRoot: boolean
  directives: Directives
  options: Readonly<Required<Omit<ParseOptions, 'lineCounter'>>>
  schema: Readonly<Schema>
}

interface Props {
  spaceBefore: boolean
  comment: string
  anchor: SourceToken | null
  tag: SourceToken | null
  end: number
}

const CN = { composeNode, composeEmptyNode }
export type ComposeNode = typeof CN

export function composeNode(
  ctx: ComposeContext,
  token: Token,
  props: Props,
  onError: ComposeErrorHandler
) {
  const { spaceBefore, comment, anchor, tag } = props
  let node: ParsedNode
  let isSrcToken = true
  switch (token.type) {
    case 'alias':
      node = composeAlias(ctx, token, onError)
      if (anchor || tag)
        onError(
          token,
          'ALIAS_PROPS',
          'An alias node must not specify any properties'
        )
      break
    case 'scalar':
    case 'single-quoted-scalar':
    case 'double-quoted-scalar':
    case 'block-scalar':
      node = composeScalar(ctx, token, tag, onError)
      if (anchor) node.anchor = anchor.source.substring(1)
      break
    case 'block-map':
    case 'block-seq':
    case 'flow-collection':
      node = composeCollection(CN, ctx, token, tag, onError)
      if (anchor) node.anchor = anchor.source.substring(1)
      break
    default: {
      const message =
        token.type === 'error'
          ? token.message
          : `Unsupported token (type: ${token.type})`
      onError(token, 'UNEXPECTED_TOKEN', message)
      node = composeEmptyNode(
        ctx,
        token.offset,
        undefined,
        null,
        props,
        onError
      )
      isSrcToken = false
    }
  }
  if (anchor && node.anchor === '')
    onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string')
  if (spaceBefore) node.spaceBefore = true
  if (comment) {
    if (token.type === 'scalar' && token.source === '') node.comment = comment
    else node.commentBefore = comment
  }
  // @ts-expect-error Type checking misses meaning of isSrcToken
  if (ctx.options.keepSourceTokens && isSrcToken) node.srcToken = token
  return node
}

export function composeEmptyNode(
  ctx: ComposeContext,
  offset: number,
  before: Token[] | undefined,
  pos: number | null,
  { spaceBefore, comment, anchor, tag, end }: Props,
  onError: ComposeErrorHandler
) {
  const token: FlowScalar = {
    type: 'scalar',
    offset: emptyScalarPosition(offset, before, pos),
    indent: -1,
    source: ''
  }
  const node = composeScalar(ctx, token, tag, onError)
  if (anchor) {
    node.anchor = anchor.source.substring(1)
    if (node.anchor === '')
      onError(anchor, 'BAD_ALIAS', 'Anchor cannot be an empty string')
  }
  if (spaceBefore) node.spaceBefore = true
  if (comment) {
    node.comment = comment
    node.range[2] = end
  }
  return node
}

function composeAlias(
  { options }: ComposeContext,
  { offset, source, end }: FlowScalar,
  onError: ComposeErrorHandler
) {
  const alias = new Alias(source.substring(1))
  if (alias.source === '')
    onError(offset, 'BAD_ALIAS', 'Alias cannot be an empty string')
  if (alias.source.endsWith(':'))
    onError(
      offset + source.length - 1,
      'BAD_ALIAS',
      'Alias ending in : is ambiguous',
      true
    )
  const valueEnd = offset + source.length
  const re = resolveEnd(end, valueEnd, options.strict, onError)
  alias.range = [offset, valueEnd, re.offset]
  if (re.comment) alias.comment = re.comment
  return alias as Alias.Parsed
}
