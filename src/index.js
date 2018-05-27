import parseAST from './ast/parse'
import Document from './Document'
import Tags from './Tags'

const parseDocuments = (src, options = {}) => {
  const ast = parseAST(src)
  const tags = new Tags(options)
  return ast.map(astDoc => {
    const doc = new Document(tags, options)
    return doc.parse(astDoc)
  })
}

const parse = (src, options = {}) => {
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
  Document,
  parse,
  parseAST,
  parseDocuments
}
