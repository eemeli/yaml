import type { Directives } from '../doc/directives.js'
import { Alias } from '../nodes/Alias.js'
import type { ParsedNode } from '../nodes/Node.js'
import type { ParseOptions } from '../options.js'
import type { FlowScalar, Token } from '../parse/cst.js'
import type { Schema } from '../schema/Schema.js'
import { composeCollection } from './compose-collection.js'
import { composeScalar } from './compose-scalar.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveEnd } from './resolve-end.js'
import { emptyScalarPosition } from './util-empty-scalar-position.js'

export interface ComposeContext {
  directives: Directives
  options: Readonly<Required<Omit<ParseOptions, 'lineCounter'>>>
  schema: Readonly<Schema>
}

export interface Props {
  spaceBefore: boolean
  comment: string
  anchor: string
  tagName: string
}

const CN = { composeNode, composeEmptyNode }
export type ComposeNode = typeof CN

export function composeNode(
  ctx: ComposeContext,
  token: Token,
  props: Props,
  onError: ComposeErrorHandler
) {
  const { spaceBefore, comment, anchor, tagName } = props
  let node: ParsedNode
  switch (token.type) {
    case 'alias':
      node = composeAlias(ctx, token, onError)
      if (anchor || tagName)
        onError(
          token.offset,
          'ALIAS_PROPS',
          'An alias node must not specify any properties'
        )
      break
    case 'scalar':
    case 'single-quoted-scalar':
    case 'double-quoted-scalar':
    case 'block-scalar':
      node = composeScalar(ctx, token, tagName, onError)
      if (anchor) {
        node.anchor = anchor
      }
      break
    case 'block-map':
    case 'block-seq':
    case 'flow-collection':
      node = composeCollection(CN, ctx, token, tagName, onError)
      if (anchor) {
        node.anchor = anchor
      }
      break
    default:
      console.log(token)
      throw new Error(`Unsupporten token type: ${(token as any).type}`)
  }
  if (spaceBefore) node.spaceBefore = true
  if (comment) {
    if (token.type === 'scalar' && token.source === '') node.comment = comment
    else node.commentBefore = comment
  }
  return node
}

export function composeEmptyNode(
  ctx: ComposeContext,
  offset: number,
  before: Token[] | undefined,
  pos: number | null,
  { spaceBefore, comment, anchor, tagName }: Props,
  onError: ComposeErrorHandler
) {
  const token: FlowScalar = {
    type: 'scalar',
    offset: emptyScalarPosition(offset, before, pos),
    indent: -1,
    source: ''
  }
  const node = composeScalar(ctx, token, tagName, onError)
  if (anchor) {
    node.anchor = anchor
  }
  if (spaceBefore) node.spaceBefore = true
  if (comment) node.comment = comment
  return node
}

function composeAlias(
  { options }: ComposeContext,
  { offset, source, end }: FlowScalar,
  onError: ComposeErrorHandler
) {
  const alias = new Alias(source.substring(1))
  const valueEnd = offset + source.length
  const re = resolveEnd(end, valueEnd, options.strict, onError)
  alias.range = [offset, valueEnd, re.offset]
  if (re.comment) alias.comment = re.comment
  return alias as Alias.Parsed
}
