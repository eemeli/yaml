import { Document } from '../doc/Document.js'
import { StreamDirectives } from '../doc/stream-directives.js'
import type { Options } from '../options.js'
import type * as Parser from '../parse/parser.js'
import { composeNode } from './compose-node.js'
import { resolveEnd } from './resolve-end.js'
import { resolveProps } from './resolve-props.js'

export function composeDoc(
  options: Options | undefined,
  directives: StreamDirectives,
  { offset, start, value, end }: Parser.Document,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const doc = new Document(undefined, options) as Document.Parsed
  doc.directives = StreamDirectives.from(directives)
  doc.version = directives.yaml.version
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
