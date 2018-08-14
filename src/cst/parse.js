// Published as 'yaml/parse-cst'

import Document from './Document'
import ParseContext from './ParseContext'

export default function parse(src) {
  const cr = []
  if (src.indexOf('\r') !== -1) {
    src = src.replace(/\r\n?/g, (match, offset) => {
      if (match.length > 1) cr.push(offset)
      return '\n'
    })
  }
  const context = new ParseContext({ src })
  const documents = []
  let offset = 0
  while (offset < src.length) {
    const doc = new Document()
    offset = doc.parse(context, offset)
    documents.push(doc)
  }
  documents.setOrigRanges = () => {
    if (cr.length === 0) return false
    for (let i = 1; i < cr.length; ++i) cr[i] -= i
    let crOffset = 0
    for (let i = 0; i < documents.length; ++i) {
      documents[i].setOrigRanges(cr, crOffset)
    }
    cr.splice(0, cr.length)
    return true
  }
  documents.toString = () => documents.join('...\n')
  return documents
}
