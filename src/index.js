/* global console */

import parseCST from './cst/parse'
import YAMLDocument from './Document'
import { YAMLSemanticError } from './errors'
import Schema from './schema'

const defaultOptions = {
  keepNodeTypes: true,
  keepBlobsInJSON: true,
  mapAsMap: false,
  tags: null,
  version: '1.2'
}

function createNode(value, wrapScalars = true, tag) {
  if (tag === undefined && typeof wrapScalars === 'string') {
    tag = wrapScalars
    wrapScalars = true
  }
  const options = Object.assign(
    {},
    YAMLDocument.defaults[defaultOptions.version],
    defaultOptions
  )
  const schema = new Schema(options)
  return schema.createNode(value, wrapScalars, tag)
}

class Document extends YAMLDocument {
  constructor(options) {
    super(Object.assign({}, defaultOptions, options))
  }
}

function parseAllDocuments(src, options) {
  return parseCST(src).map(cstDoc => new Document(options).parse(cstDoc))
}

function parseDocument(src, options) {
  const cst = parseCST(src)
  const doc = new Document(options).parse(cst[0])
  if (cst.length > 1) {
    const errMsg =
      'Source contains multiple documents; please use YAML.parseAllDocuments()'
    doc.errors.unshift(new YAMLSemanticError(cst[1], errMsg))
  }
  return doc
}

function parse(src, options) {
  const doc = parseDocument(src, options)
  // eslint-disable-next-line no-console
  doc.warnings.forEach(warning => console.warn(warning))
  if (doc.errors.length > 0) throw doc.errors[0]
  return doc.toJSON()
}

function stringify(value, options) {
  const doc = new Document(options)
  doc.contents = value
  return String(doc)
}

export default {
  createNode,
  defaultOptions,
  Document,
  parse,
  parseAllDocuments,
  parseCST,
  parseDocument,
  stringify
}
