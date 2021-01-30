import { Directives } from '../doc/directives.js'
import { Document } from '../doc/Document.js'
import type { Options } from '../options.js'
import type * as Tokens from '../parse/tokens.js'
import { composeNode } from './compose-node.js'
import { resolveEnd } from './resolve-end.js'
import { resolveProps } from './resolve-props.js'

export function composeDoc(
  options: Options | undefined,
  directives: Directives,
  { offset, start, value, end }: Tokens.Document,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const doc = new Document(undefined, options) as Document.Parsed
  doc.directives = directives.atDocument()
  doc.setSchema() // FIXME: always do this in the constructor

  const props = resolveProps(doc, start, true, 'doc-start', offset, onError)
  if (props.found !== -1) doc.directivesEndMarker = true

  doc.contents = composeNode(
    doc,
    value || offset + props.length,
    props,
    onError
  )

  const re = resolveEnd(end, doc.contents.range[1], false, onError)
  if (re.comment) doc.comment = re.comment
  doc.range = [offset, re.offset]
  return doc
}
