import { Document } from './Document.js'
import { ParseContext } from './ParseContext.js'

export function parse(src) {
  const cr = []
  if (src.indexOf('\r') !== -1) {
    src = src.replace(/\r\n?/g, (match, offset) => {
      if (match.length > 1) cr.push(offset)
      return '\n'
    })
  }
  const documents = []
  let offset = 0
  do {
    const doc = new Document()
    const context = new ParseContext({ src })
    offset = doc.parse(context, offset)
    documents.push(doc)
  } while (offset < src.length)
  documents.setOrigRanges = () => {
    if (cr.length === 0) return false
    for (let i = 1; i < cr.length; ++i) cr[i] -= i
    let crOffset = 0
    for (let i = 0; i < documents.length; ++i) {
      crOffset = documents[i].setOrigRanges(cr, crOffset)
    }
    cr.splice(0, cr.length)
    return true
  }
  documents.toString = () => documents.join('...\n')
  return documents
}
