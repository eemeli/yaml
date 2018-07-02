import parseCST from './cst/parse'
import createNode from './createNode'
import Document from './Document'

const defaultOptions = {
  tags: null,
  version: '1.2'
}

function parseDocuments(src, options) {
  return parseCST(src).map(astDoc =>
    new Document(Object.assign({}, defaultOptions, options)).parse(astDoc)
  )
}

function parse(src, options) {
  const docs = parseDocuments(src, options)
  docs.forEach(doc => {
    doc.warnings.forEach(warning => console.warn(warning))
    doc.errors.forEach(error => {
      throw error
    })
  })
  if (docs.length > 1) {
    throw new Error(
      'Source contains multiple documents; please use YAML.parseDocuments()'
    )
  }
  return docs[0] && docs[0].toJSON()
}

function stringify(value, options) {
  const doc = new Document(Object.assign({}, defaultOptions, options))
  doc.contents = value
  return String(doc)
}

export default {
  createNode,
  defaultOptions,
  Document: class extends Document {
    constructor(options) {
      super(Object.assign({}, defaultOptions, options))
    }
  },
  parse,
  parseDocuments,
  stringify
}
