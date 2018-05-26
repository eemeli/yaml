import parseAST from './ast/parse'
import Document from './Document'
import { YAMLWarning } from './errors'
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
  docs.forEach(doc => doc.errors.forEach(error => {
    if (error instanceof YAMLWarning) {
      if (typeof console !== 'undefined') console.warn(error)
    } else {
      throw error
    }
  }))
  if (options.docArray) return docs.map(doc => doc.toJSON())
  if (docs.length > 1) {
    throw new Error('Source contains multiple documents; set options.docArray = true or use parseDocuments()')
  }
  return docs[0] && docs[0].toJSON()
}

export default {
  Document,
  parse,
  parseAST,
  parseDocuments
}
