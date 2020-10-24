import { Document } from '../doc/Document.js'
import type { Options } from '../options.js'
import type * as Parser from '../parse/parser.js'
import { composeNode } from './compose-node.js'
import { resolveEnd } from './resolve-end.js'
import { resolveProps } from './resolve-props.js'
import { StreamDirectives } from './stream-directives.js'

export function composeDoc(
  options: Options | null,
  directives: StreamDirectives,
  { offset, start, value, end }: Parser.Document,
  onError: (offset: number, message: string, warning?: boolean) => void
) {
  const doc = new Document(undefined, options || undefined) as Document.Parsed
  doc.version = directives.yaml.version
  doc.setSchema() // FIXME: always do this in the constructor

  const props = resolveProps(start, 'doc-start', offset, onError)
  if (props.found) doc.directivesEndMarker = true

  let to = offset + props.length
  doc.contents = composeNode(doc, value || to, props, onError)
  if (doc.contents.range) to = doc.contents.range[1]
  else {
    // FIXME: remove once verified never happens
    onError(to, 'Resolved child node has no range')
    if (value) {
      if ('offset' in value) to = value.offset
      if ('source' in value && value.source) to += value.source.length
    }
  }
  const { comment, length } = resolveEnd(end)
  if (comment) doc.comment = comment

  doc.range = [offset, to + length]
  return doc
}
