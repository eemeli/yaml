import Document from './Document'
import ParseContext from './ParseContext'

export default function parse(src) {
  if (src.indexOf('\r') !== -1) src = src.replace(/\r\n?/g, '\n')
  const context = new ParseContext({ src })
  const documents = []
  let offset = 0
  while (offset < src.length) {
    const doc = new Document()
    offset = doc.parse(context, offset)
    documents.push(doc)
  }
  documents.toString = () => documents.join('...\n')
  return documents
}
