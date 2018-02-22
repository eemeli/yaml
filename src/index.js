import parseAST from './ast/parse'
import Document from './Document'
import Tags from './Tags'

export default function resolve (src, options = {}) {
  const ast = parseAST(src)
  const tags = new Tags(options)
  return ast.map(doc => new Document(tags, doc, options))
}
