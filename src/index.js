import parse from 'raw-yaml'
import Document from './Document'
import Tags from './tags'

export default function resolve (src, options = {}) {
  const ast = parse(src)
  const tags = new Tags(options)
  return ast.map(doc => new Document(tags, doc))
}
