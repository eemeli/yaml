export function findLineOffsets(src) {
  const lf = [0]
  let offset = src.indexOf('\n')
  while (offset !== -1) {
    offset += 1
    lf.push(offset)
    offset = src.indexOf('\n', offset)
  }
  return lf
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
