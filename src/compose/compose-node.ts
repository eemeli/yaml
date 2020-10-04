import { Alias, Node } from '../ast/index.js'
import type { Document } from '../doc/Document.js'
import type { FlowScalar, Token } from '../parse/parser.js'
import { composeBlockSeq } from './compose-block-seq.js'
import { composeScalar } from './compose-scalar.js'
import { resolveEnd } from './resolve-end.js'

export function composeNode(
  doc: Document.Parsed,
  token: Token | null,
  tagName: string | null,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  if (!token) token = { type: 'scalar', offset: 0, indent: 0, source: '' }
  switch (token.type) {
    case 'alias':
      return composeAlias(doc.anchors, token, onError)
    case 'scalar':
    case 'single-quoted-scalar':
    case 'double-quoted-scalar':
    case 'block-scalar':
      return composeScalar(doc.schema, tagName, token, onError)
    case 'block-seq':
      // FIXME: anchor on collection needs to resolve in the collection
      return composeBlockSeq(doc, token, onError)
  }
  return new Node()
}

function composeAlias(
  anchors: Document.Anchors,
  { offset, source, end }: FlowScalar,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const name = source.substring(1)
  const src = anchors.getNode(name)

  // FIXME: Lazy resolution for circular references
  const alias = new Alias(src as Node)

  if (src) anchors._cstAliases.push(alias)
  else onError(offset, `Aliased anchor not found: ${name}`)

  const { comment, length } = resolveEnd(end)
  alias.range = [offset, offset + source.length + length]
  if (comment) alias.comment = comment
  return alias
}
