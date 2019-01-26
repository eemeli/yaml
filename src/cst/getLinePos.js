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
  if (typeof offset === 'number' && offset >= 0 && lineOffsets) {
    for (let i = 0; i < lineOffsets.length; ++i) {
      const start = lineOffsets[i]
      if (offset < start) {
        const line = i - 1
        return { line, col: offset - lineOffsets[line] }
      }
      if (offset === start) return { line: i, col: 0 }
    }
  }
  return { line: undefined, col: undefined }
}
