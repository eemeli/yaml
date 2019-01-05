// Published as 'yaml/parse-cst'

import Document from './Document'
import ParseContext from './ParseContext'

export default function parse(src, options) {
  const defaultOptions = { computeLineOffsets: false }
  options = Object.assign({}, defaultOptions, options)
  const cr = []
  const lf = [0]
  if (src.indexOf('\r') !== -1) {
    src = src.replace(/\r\n?/g, (match, offset) => {
      if (match.length > 1) cr.push(offset)
      return '\n'
    })
  }
  if (options.computeLineOffsets)
    src = src.replace(/\n/g, (match, offset) => {
      lf.push(offset + 1)
      return '\n'
    })
  const context = new ParseContext({ src })
  const documents = []
  let offset = 0
  do {
    const doc = new Document()
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
  if (options.computeLineOffsets) documents.lineOffsets = lf
  return documents
}

export function charPosToLineCol(offset, lineOffsets) {
  if (
    !lineOffsets ||
    typeof offset === 'undefined' ||
    offset < 0 ||
    offset > lineOffsets[lineOffsets.length - 1]
  )
    return { line: undefined, col: undefined }
  const lineIndex = lineOffsets.indexOf(offset)
  if (lineIndex >= 0)
    return { line: lineIndex, col: offset - lineOffsets[lineIndex] }
  for (let i = 0; i < lineOffsets.length; i++) {
    if (lineOffsets[i] > offset) {
      return { line: i - 1, col: offset - lineOffsets[i - 1] }
    }
  }
  return { line: undefined, col: undefined }
}
