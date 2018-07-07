import parseCST from './cst/parse'
import createNode from './createNode'
import YAMLDocument from './Document'

const defaultOptions = {
  keepNodeTypes: true,
  keepBlobsInJSON: true,
  tags: null,
  version: '1.2'
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
  if (cst.length > 1) {
    throw new Error(
      'Source contains multiple documents; please use YAML.parseAllDocuments()'
    )
  }
  return new Document(options).parse(cst[0])
}

function parse(src, options) {
  const doc = parseDocument(src, options)
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
  parseDocument,
  stringify
}
