import parseAST from './ast/parse'
import Document from './Document'
import { YAMLWarning } from './errors'
import Tags from './Tags'

const parseStream = (src, options = {}) => {
  const ast = parseAST(src)
  const tags = new Tags(options)
  return ast.map(astDoc => {
    const doc = new Document(tags, options)
    return doc.parse(astDoc)
  })
}

const parse = (src, options = {}) => {
  const stream = parseStream(src, options)
  stream.forEach(doc => doc.errors.forEach(error => {
    if (error instanceof YAMLWarning) {
      if (typeof console !== 'undefined') console.warn(error)
    } else {
      throw error
    }
  }))
  if (options.docArray) return stream.map(doc => doc.toJSON())
  if (stream.length > 1) {
    throw new Error('Source contains multiple documents; set options.docArray = true or use parseStream()')
  }
  return stream[0] && stream[0].toJSON()
}

export default {
  Document,
  parse,
  parseAST,
  parseStream
}
