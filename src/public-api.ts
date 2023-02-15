import { Composer } from './compose/composer.js'
import type { Reviver } from './doc/applyReviver.js'
import { Document, Replacer } from './doc/Document.js'
import { prettifyError, YAMLParseError } from './errors.js'
import { warn } from './log.js'
import type { Node, ParsedNode } from './nodes/Node.js'
import type {
  CreateNodeOptions,
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
  ToStringOptions
} from './options.js'
import { LineCounter } from './parse/line-counter.js'
import { Parser } from './parse/parser.js'

export interface EmptyStream
  extends Array<Document.Parsed>,
    ReturnType<Composer['streamInfo']> {
  empty: true
}

function parseOptions(options: ParseOptions) {
  const prettyErrors = options.prettyErrors !== false
  const lineCounter =
    options.lineCounter || (prettyErrors && new LineCounter()) || null
  return { lineCounter, prettyErrors }
}

/**
 * Parse the input as a stream of YAML documents.
 *
 * Documents should be separated from each other by `...` or `---` marker lines.
 *
 * @returns If an empty `docs` array is returned, it will be of type
 *   EmptyStream and contain additional stream information. In
 *   TypeScript, you should use `'empty' in docs` as a type guard for it.
 */
export function parseAllDocuments<
  Contents extends Node = ParsedNode,
  Strict extends boolean = true
>(
  source: string,
  options: ParseOptions & DocumentOptions & SchemaOptions = {}
):
  | Array<
      Contents extends ParsedNode
        ? Document.Parsed<Contents, Strict>
        : Document<Contents, Strict>
    >
  | EmptyStream {
  const { lineCounter, prettyErrors } = parseOptions(options)
  const parser = new Parser(lineCounter?.addNewLine)
  const composer = new Composer(options)
  const docs = Array.from(composer.compose(parser.parse(source)))

  if (prettyErrors && lineCounter)
    for (const doc of docs) {
      doc.errors.forEach(prettifyError(source, lineCounter))
      doc.warnings.forEach(prettifyError(source, lineCounter))
    }

  type DocType = Contents extends ParsedNode
    ? Document.Parsed<Contents, Strict>
    : Document<Contents, Strict>
  if (docs.length > 0) return docs as DocType[]
  return Object.assign<
    DocType[],
    { empty: true },
    ReturnType<Composer['streamInfo']>
  >([], { empty: true }, composer.streamInfo())
}

/** Parse an input string into a single YAML.Document */
export function parseDocument<
  Contents extends Node = ParsedNode,
  Strict extends boolean = true
>(
  source: string,
  options: ParseOptions & DocumentOptions & SchemaOptions = {}
): Contents extends ParsedNode
  ? Document.Parsed<Contents, Strict>
  : Document<Contents, Strict> {
  const { lineCounter, prettyErrors } = parseOptions(options)
  const parser = new Parser(lineCounter?.addNewLine)
  const composer = new Composer(options)

  type DocType = Contents extends ParsedNode
    ? Document.Parsed<Contents, Strict>
    : Document<Contents, Strict>
  // `doc` is always set by compose.end(true) at the very latest
  let doc: DocType = null as any
  for (const _doc of composer.compose(
    parser.parse(source),
    true,
    source.length
  )) {
    if (!doc) doc = _doc as DocType
    else if (doc.options.logLevel !== 'silent') {
      doc.errors.push(
        new YAMLParseError(
          _doc.range.slice(0, 2) as [number, number],
          'MULTIPLE_DOCS',
          'Source contains multiple documents; please use YAML.parseAllDocuments()'
        )
      )
      break
    }
  }

  if (prettyErrors && lineCounter) {
    doc.errors.forEach(prettifyError(source, lineCounter))
    doc.warnings.forEach(prettifyError(source, lineCounter))
  }
  return doc
}

/**
 * Parse an input string into JavaScript.
 *
 * Only supports input consisting of a single YAML document; for multi-document
 * support you should use `YAML.parseAllDocuments`. May throw on error, and may
 * log warnings using `console.warn`.
 *
 * @param str - A string with YAML formatting.
 * @param reviver - A reviver function, as in `JSON.parse()`
 * @returns The value will match the type of the root value of the parsed YAML
 *   document, so Maps become objects, Sequences arrays, and scalars result in
 *   nulls, booleans, numbers and strings.
 */
export function parse(
  src: string,
  options?: ParseOptions & DocumentOptions & SchemaOptions & ToJSOptions
): any
export function parse(
  src: string,
  reviver: Reviver,
  options?: ParseOptions & DocumentOptions & SchemaOptions & ToJSOptions
): any

export function parse(
  src: string,
  reviver?:
    | Reviver
    | (ParseOptions & DocumentOptions & SchemaOptions & ToJSOptions),
  options?: ParseOptions & DocumentOptions & SchemaOptions & ToJSOptions
): any {
  let _reviver: Reviver | undefined = undefined
  if (typeof reviver === 'function') {
    _reviver = reviver
  } else if (options === undefined && reviver && typeof reviver === 'object') {
    options = reviver
  }

  const doc = parseDocument(src, options)
  if (!doc) return null
  doc.warnings.forEach(warning => warn(doc.options.logLevel, warning))
  if (doc.errors.length > 0) {
    if (doc.options.logLevel !== 'silent') throw doc.errors[0]
    else doc.errors = []
  }
  return doc.toJS(Object.assign({ reviver: _reviver }, options))
}

/**
 * Stringify a value as a YAML document.
 *
 * @param replacer - A replacer array or function, as in `JSON.stringify()`
 * @returns Will always include `\n` as the last character, as is expected of YAML documents.
 */
export function stringify(
  value: any,
  options?: DocumentOptions &
    SchemaOptions &
    ParseOptions &
    CreateNodeOptions &
    ToStringOptions
): string
export function stringify(
  value: any,
  replacer?: Replacer | null,
  options?:
    | string
    | number
    | (DocumentOptions &
        SchemaOptions &
        ParseOptions &
        CreateNodeOptions &
        ToStringOptions)
): string

export function stringify(
  value: any,
  replacer?:
    | Replacer
    | (DocumentOptions &
        SchemaOptions &
        ParseOptions &
        CreateNodeOptions &
        ToStringOptions)
    | null,
  options?:
    | string
    | number
    | (DocumentOptions &
        SchemaOptions &
        ParseOptions &
        CreateNodeOptions &
        ToStringOptions)
) {
  let _replacer: Replacer | null = null
  if (typeof replacer === 'function' || Array.isArray(replacer)) {
    _replacer = replacer
  } else if (options === undefined && replacer) {
    options = replacer
  }

  if (typeof options === 'string') options = options.length
  if (typeof options === 'number') {
    const indent = Math.round(options)
    options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent }
  }
  if (value === undefined) {
    const { keepUndefined } = options ?? (replacer as CreateNodeOptions) ?? {}
    if (!keepUndefined) return undefined
  }
  return new Document(value, _replacer, options).toString(options)
}
