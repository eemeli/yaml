import parseAST from './ast/parse'
import Document from './Document'
import Tags from './Tags'

const defaultOptions = {
  merge: false,
  schema: 'core',
  tags: null
}

function parseDocuments (src, options) {
  const o = options ? Object.assign({}, defaultOptions, options): defaultOptions
  const tags = new Tags(o)
  return parseAST(src).map(astDoc => {
    const doc = new Document(tags, o)
    return doc.parse(astDoc)
  })
}

function parse (src, options) {
  const docs = parseDocuments(src, options)
  docs.forEach(doc => {
    doc.warnings.forEach(warning => console.warn(warning))
    doc.errors.forEach(error => { throw error })
  })
  if (docs.length > 1) {
    throw new Error('Source contains multiple documents; please use YAML.parseDocuments()')
  }
  return docs[0] && docs[0].toJSON()
}

export default {
  defaultOptions,
  Document: class extends Document {
    constructor(tags, options) {
      super(tags, Object.assign({}, defaultOptions, options))
    }
  },
  parse,
  parseDocuments
}
