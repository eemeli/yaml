import Document from './Document'
import parseNode from './parseNode';

export default function parseStream (src) {
  const context = { parseNode, src }
  const documents = []
  let offset = 0
  while (offset < src.length) {
    const doc = new Document()
    offset = doc.parse(context, offset)
    documents.push(doc)
  }
  return documents
}
