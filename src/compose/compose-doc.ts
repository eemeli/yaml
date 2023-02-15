import type { Directives } from '../doc/directives.js'
import { Document } from '../doc/Document.js'
import type { ParsedNode } from '../nodes/Node.js'
import type {
  DocumentOptions,
  ParseOptions,
  SchemaOptions
} from '../options.js'
import type * as CST from '../parse/cst.js'
import {
  ComposeContext,
  composeEmptyNode,
  composeNode
} from './compose-node.js'
import type { ComposeErrorHandler } from './composer.js'
import { resolveEnd } from './resolve-end.js'
import { resolveProps } from './resolve-props.js'

export function composeDoc<
  Contents extends ParsedNode = ParsedNode,
  Strict extends boolean = true
>(
  options: ParseOptions & DocumentOptions & SchemaOptions,
  directives: Directives,
  { offset, start, value, end }: CST.Document,
  onError: ComposeErrorHandler
) {
  const opts = Object.assign({ _directives: directives }, options)
  const doc = new Document(undefined, opts) as Document.Parsed<Contents, Strict>
  const ctx: ComposeContext = {
    atRoot: true,
    directives: doc.directives,
    options: doc.options,
    schema: doc.schema
  }
  const props = resolveProps(start, {
    indicator: 'doc-start',
    next: value ?? end?.[0],
    offset,
    onError,
    startOnNewline: true
  })
  if (props.found) {
    doc.directives.docStart = true
    if (
      value &&
      (value.type === 'block-map' || value.type === 'block-seq') &&
      !props.hasNewline
    )
      onError(
        props.end,
        'MISSING_CHAR',
        'Block collection cannot start on same line with directives-end marker'
      )
  }
  // @ts-expect-error If Contents is set, let's trust the user
  doc.contents = value
    ? composeNode(ctx, value, props, onError)
    : composeEmptyNode(ctx, props.end, start, null, props, onError)

  const contentEnd = doc.contents.range[2]
  const re = resolveEnd(end, contentEnd, false, onError)
  if (re.comment) doc.comment = re.comment
  doc.range = [offset, contentEnd, re.offset]
  return doc
}
