import { Composer } from './compose/composer.js'
import type { Reviver } from './doc/applyReviver.js'
import { Document, Replacer } from './doc/Document.js'
import { YAMLParseError } from './errors.js'
import { warn } from './log.js'
import type { ParsedNode } from './nodes/Node.js'
import type { Options, ToJSOptions, ToStringOptions } from './options.js'
import { Parser } from './parse/parser.js'

export interface EmptyStream
  extends Array<Document.Parsed>,
    ReturnType<Composer['streamInfo']> {
  empty: true
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
export function parseAllDocuments<T extends ParsedNode = ParsedNode>(
  source: string,
  options?: Options
): Document.Parsed<T>[] | EmptyStream {
  const docs: Document.Parsed<T>[] = []
  const composer = new Composer(
    doc => docs.push(doc as Document.Parsed<T>),
    options
  )
  const parser = new Parser(composer.next, options?.lineCounter?.addNewLine)
  parser.parse(source)
  composer.end()

  if (docs.length > 0) return docs
  return Object.assign<
    Document.Parsed<T>[],
    { empty: true },
    ReturnType<Composer['streamInfo']>
  >([], { empty: true }, composer.streamInfo())
}

/** Parse an input string into a single YAML.Document */
export function parseDocument<T extends ParsedNode = ParsedNode>(
  source: string,
  options?: Options
) {
  let doc: Document.Parsed<T> | null = null
  const composer = new Composer(_doc => {
    if (!doc) doc = _doc as Document.Parsed<T>
    else if (doc.options.logLevel !== 'silent') {
      const errMsg =
        'Source contains multiple documents; please use YAML.parseAllDocuments()'
      doc.errors.push(new YAMLParseError(_doc.range[0], errMsg))
    }
  }, options)
  const parser = new Parser(composer.next, options?.lineCounter?.addNewLine)
  parser.parse(source)
  composer.end(true, source.length)
  // `doc` is always set by compose.end(true) at the very latest
  return (doc as unknown) as Document.Parsed<T>
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
export function parse(src: string, options?: Options & ToJSOptions): any
export function parse(
  src: string,
  reviver: Reviver,
  options?: Options & ToJSOptions
): any

export function parse(
  src: string,
  reviver?: Reviver | (Options & ToJSOptions),
  options?: Options & ToJSOptions
) {
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
  options?: Options & ToStringOptions
): string
export function stringify(
  value: any,
  replacer?: Replacer | null,
  options?: string | number | (Options & ToStringOptions)
): string
export function stringify(
  value: any,
  replacer?: Replacer | (Options & ToStringOptions) | null,
  options?: string | number | (Options & ToStringOptions)
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
    const { keepUndefined } =
      options || (replacer as Options & ToStringOptions) || {}
    if (!keepUndefined) return undefined
  }
  return new Document(value, _replacer, options).toString(options)
}
