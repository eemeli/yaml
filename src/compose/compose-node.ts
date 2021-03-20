import { Anchors } from '../doc/Anchors.js'
import type { Directives } from '../doc/directives.js'
import { Alias } from '../nodes/Alias.js'
import type { Node, ParsedNode } from '../nodes/Node.js'
import type { ParseOptions } from '../options.js'
import type { FlowScalar, Token } from '../parse/tokens.js'
import type { Schema } from '../schema/Schema.js'
import { composeCollection } from './compose-collection.js'
import { composeScalar } from './compose-scalar.js'
import { resolveEnd } from './resolve-end.js'
import { emptyScalarPosition } from './util-empty-scalar-position.js'

export interface ComposeContext {
  anchors: Anchors
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
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const { spaceBefore, comment, anchor, tagName } = props
  let node: ParsedNode
  switch (token.type) {
    case 'alias':
      node = composeAlias(ctx, token, onError)
      if (anchor || tagName)
        onError(token.offset, 'An alias node must not specify any properties')
      break
    case 'scalar':
    case 'single-quoted-scalar':
    case 'double-quoted-scalar':
    case 'block-scalar':
      node = composeScalar(ctx, token, anchor, tagName, onError)
      break
    case 'block-map':
    case 'block-seq':
    case 'flow-collection':
      node = composeCollection(CN, ctx, token, anchor, tagName, onError)
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
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const token: FlowScalar = {
    type: 'scalar',
    offset: emptyScalarPosition(offset, before, pos),
    indent: -1,
    source: ''
  }
  const node = composeScalar(ctx, token, anchor, tagName, onError)
  if (spaceBefore) node.spaceBefore = true
  if (comment) node.comment = comment
  return node
}

function composeAlias(
  { anchors, options }: ComposeContext,
  { offset, source, end }: FlowScalar,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const name = source.substring(1)
  const src = anchors.getNode(name)
  if (!src) onError(offset, `Aliased anchor not found: ${name}`)
  const alias = new Alias(src as Node)

  const re = resolveEnd(end, offset + source.length, options.strict, onError)
  alias.range = [offset, re.offset]
  if (re.comment) alias.comment = re.comment
  return alias as Alias.Parsed
}
