import { Composer } from './compose/composer.js'
import { LogLevel } from './constants.js'
import { Document, Replacer, Reviver } from './doc/Document.js'
import { YAMLParseError } from './errors.js'
import { warn } from './log.js'
import { Options } from './options.js'
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
export function parseAllDocuments(
  source: string,
  options?: Options
): Document.Parsed[] | EmptyStream {
  const docs: Document.Parsed[] = []
  const composer = new Composer(doc => docs.push(doc), options)
  const parser = new Parser(composer.next, options?.lineCounter?.addNewLine)
  parser.parse(source)
  composer.end()

  if (docs.length > 0) return docs
  return Object.assign<
    Document.Parsed[],
    { empty: true },
    ReturnType<Composer['streamInfo']>
  >([], { empty: true }, composer.streamInfo())
}

/** Parse an input string into a single YAML.Document */
export function parseDocument(
  source: string,
  options?: Options
): Document.Parsed | null {
  let doc: Document.Parsed | null = null
  const composer = new Composer(_doc => {
    if (!doc) doc = _doc
    else if (LogLevel.indexOf(doc.options.logLevel) >= LogLevel.ERROR) {
      const errMsg =
        'Source contains multiple documents; please use YAML.parseAllDocuments()'
      doc.errors.push(new YAMLParseError(_doc.range[0], errMsg))
    }
  }, options)
  const parser = new Parser(composer.next, options?.lineCounter?.addNewLine)
  parser.parse(source)
  composer.end(true, source.length)
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
export function parse(src: string, options?: Options): any
export function parse(
  src: string,
  reviver: (key: string, value: any) => any,
  options?: Options
): any

export function parse(
  src: string,
  reviver?: Reviver | Options,
  options?: Options
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
    if (LogLevel.indexOf(doc.options.logLevel) >= LogLevel.ERROR)
      throw doc.errors[0]
    else doc.errors = []
  }
  return doc.toJS({ reviver: _reviver })
}

/**
 * Stringify a value as a YAML document.
 *
 * @param replacer - A replacer array or function, as in `JSON.stringify()`
 * @returns Will always include `\n` as the last character, as is expected of YAML documents.
 */
export function stringify(value: any, options?: Options): string
export function stringify(
  value: any,
  replacer?: Replacer | null,
  options?: string | number | Options
): string
export function stringify(
  value: any,
  replacer?: Replacer | Options | null,
  options?: string | number | Options
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
    const { keepUndefined } = options || (replacer as Options) || {}
    if (!keepUndefined) return undefined
  }
  return new Document(value, _replacer, options).toString()
}
