import { Alias, Node } from '../ast/index.js'
import type { Document } from '../doc/Document.js'
import type { FlowScalar, Token } from '../parse/parser.js'
import { composeBlockMap } from './compose-block-map.js'
import { composeBlockSeq } from './compose-block-seq.js'
import { composeScalar } from './compose-scalar.js'
import { resolveEnd } from './resolve-end.js'
import type { Props } from './resolve-props.js'

export function composeNode(
  doc: Document.Parsed,
  token: Token,
  { spaceBefore, comment, anchor, tagName }: Props,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  let node: Node
  switch (token.type) {
    case 'alias':
      node = composeAlias(doc.anchors, token, onError)
      if (anchor || tagName)
        onError(token.offset, 'An alias node must not specify any properties')
      break
    case 'scalar':
    case 'single-quoted-scalar':
    case 'double-quoted-scalar':
    case 'block-scalar':
      node = composeScalar(doc.schema, tagName, token, onError)
      if (anchor) doc.anchors.setAnchor(node, anchor)
      break
    case 'block-map':
      node = composeBlockMap(doc, token, anchor, onError)
      break
    case 'block-seq':
      node = composeBlockSeq(doc, token, anchor, onError)
      break
    default:
      onError(
        'offset' in token ? token.offset : -1,
        `Unsupporten token type: ${token.type}`
      )
      return new Node()
  }
  if (spaceBefore) node.spaceBefore = true
  if (comment) {
    if (token.type === 'scalar' && token.source === '') node.comment = comment
    else node.commentBefore = comment
  }
  return node
}

function composeAlias(
  anchors: Document.Anchors,
  { offset, source, end }: FlowScalar,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const name = source.substring(1)
  const src = anchors.getNode(name)
  if (!src) onError(offset, `Aliased anchor not found: ${name}`)
  const alias = new Alias(src as Node)
  const { comment, length } = resolveEnd(end)
  alias.range = [offset, offset + source.length + length]
  if (comment) alias.comment = comment
  return alias
}
