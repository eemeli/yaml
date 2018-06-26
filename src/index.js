import parseAST from './ast/parse'
import createNode from './createNode'
import Document from './Document'
import Schema from './schema'

const defaultOptions = {
  merge: false,
  schema: 'core',
  tags: null
}

function parseDocuments(src, options) {
  const resolvedOptions = options
    ? Object.assign({}, defaultOptions, options)
    : defaultOptions
  const schema = new Schema(resolvedOptions)
  return parseAST(src).map(astDoc => new Document(schema).parse(astDoc))
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
  const resolvedOptions = options
    ? Object.assign({}, defaultOptions, options)
    : defaultOptions
  const doc = new Document(resolvedOptions)
  doc.contents = value
  return String(doc)
}

export default {
  createNode,
  defaultOptions,
  Document: class extends Document {
    constructor(schema) {
      if (schema instanceof Schema) {
        super(schema)
      } else {
        super(Object.assign({}, defaultOptions, schema))
      }
    }
  },
  parse,
  parseDocuments,
  stringify
}
