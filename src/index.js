import parseAST from './ast/parse'
import Document from './Document'
import Tags from './Tags'

const defaultOptions = {
  merge: false,
  schema: 'core',
  tags: null
}

function parseDocuments(src, options) {
  const resolvedOptions = options
    ? Object.assign({}, defaultOptions, options)
    : defaultOptions
  const tags = new Tags(resolvedOptions)
  return parseAST(src).map(astDoc => new Document(tags).parse(astDoc))
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
  defaultOptions,
  Document: class extends Document {
    constructor(tags) {
      if (tags instanceof Tags) {
        super(tags)
      } else {
        super(Object.assign({}, defaultOptions, tags))
      }
    }
  },
  parse,
  parseDocuments,
  stringify
}
