import parseAST from './ast/parse'
import Document from './Document'
import Tags from './Tags'

export default function resolve (src, options = {}) {
  const ast = parseAST(src)
  const tags = new Tags(options)
  return ast.map(doc => new Document(tags, doc, options))
}

const deprecatedEval = () => {
  throw new Error('The yaml API has changed, try replacing `eval(str)` with `resolve(str)[0].toJSON()`')
}
const deprecatedTokenize = () => {
  throw new Error('The yaml API has changed, see README.md for more information')
}
export {
  deprecatedEval as eval,
  deprecatedTokenize as tokenize
}
