import { parse as parseCST } from './cst/parse.js'
import { Document as YAMLDocument } from './doc/Document.js'
import { YAMLSemanticError } from './errors.js'
import { defaultOptions, scalarOptions } from './options.js'
import { warn } from './warnings.js'

class Document extends YAMLDocument {
  constructor(contents, options) {
    super(contents, Object.assign({}, defaultOptions, options))
  }
}

function parseAllDocuments(src, options) {
  const stream = []
  let prev
  for (const cstDoc of parseCST(src)) {
    const doc = new Document(undefined, options)
    doc.parse(cstDoc, prev)
    stream.push(doc)
    prev = doc
  }
  return stream
}

function parseDocument(src, options) {
  const cst = parseCST(src)
  const doc = new Document(cst[0], options)
  if (cst.length > 1) {
    const errMsg =
      'Source contains multiple documents; please use YAML.parseAllDocuments()'
    doc.errors.unshift(new YAMLSemanticError(cst[1], errMsg))
  }
  return doc
}

function parse(src, options) {
  const doc = parseDocument(src, options)
  doc.warnings.forEach(warning => warn(warning))
  if (doc.errors.length > 0) throw doc.errors[0]
  return doc.toJSON()
}

function stringify(value, options) {
  if (value === undefined) return '\n'
  return new Document(value, options).toString()
}

export const YAML = {
  defaultOptions,
  Document,
  parse,
  parseAllDocuments,
  parseCST,
  parseDocument,
  scalarOptions,
  stringify
}
