import { Composer } from './compose/composer.js'
import { LogLevel } from './constants.js'
import { Document } from './doc/Document.js'
import { YAMLParseError } from './errors.js'
import { warn } from './log.js'
import { Options } from './options.js'
import { Parser } from './parse/parser.js'

export { defaultOptions, scalarOptions } from './options.js'
export { LineCounter } from './parse/line-counter.js'
export { visit } from './visit.js'
export { Document }

export interface EmptyStream
  extends Array<Document.Parsed>,
    ReturnType<Composer['streamInfo']> {
  empty: true
}

/**
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
  const parser = new Parser(
    token => composer.handleToken(token),
    options?.lineCounter?.addNewLine
  )
  parser.parse(source)
  composer.handleEnd(false, source.length)

  if (docs.length > 0) return docs
  return Object.assign<
    Document.Parsed[],
    { empty: true },
    ReturnType<Composer['streamInfo']>
  >([], { empty: true }, composer.streamInfo())
}

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
  const parser = new Parser(
    token => composer.handleToken(token),
    options?.lineCounter?.addNewLine
  )
  parser.parse(source)
  composer.handleEnd(true, source.length)
  return doc
}

export function parse(
  src: string,
  reviver?: (key: string, value: any) => any,
  options?: Options
) {
  if (options === undefined && reviver && typeof reviver === 'object') {
    options = reviver
    reviver = undefined
  }

  const doc = parseDocument(src, options)
  if (!doc) return null
  doc.warnings.forEach(warning => warn(doc.options.logLevel, warning))
  if (doc.errors.length > 0) {
    if (LogLevel.indexOf(doc.options.logLevel) >= LogLevel.ERROR)
      throw doc.errors[0]
    else doc.errors = []
  }
  return doc.toJS({ reviver })
}

export function stringify(
  value: any,
  replacer?: (key: string, value: any) => any,
  options?: string | number | Options
) {
  if (typeof options === 'string') options = options.length
  if (typeof options === 'number') {
    const indent = Math.round(options)
    options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent }
  }
  if (value === undefined) {
    const { keepUndefined } = options || (replacer as Options) || {}
    if (!keepUndefined) return undefined
  }
  return new Document(value, replacer || null, options).toString()
}
