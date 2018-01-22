import Document from './Document'
import ParseContext from './ParseContext'

export default function parseStream (src) {
  const context = new ParseContext({ src })
  const documents = []
  let offset = 0
  while (offset < src.length) {
    const doc = new Document()
    offset = doc.parse(context, offset)
    documents.push(doc)
  }
  return documents
}
