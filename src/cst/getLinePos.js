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

export function charPosToLineCol(offset, cst) {
  if (typeof offset === 'number' && offset >= 0) {
    let lineOffsets
    if (typeof cst === 'string') {
      lineOffsets = findLineOffsets(cst)
    } else {
      if (Array.isArray(cst)) cst = cst[0] // accept array of CST documents
      if (cst) {
        if (!cst.lineOffsets) cst.lineOffsets = findLineOffsets(cst.context.src)
        lineOffsets = cst.lineOffsets
      }
    }
    if (lineOffsets) {
      for (let i = 0; i < lineOffsets.length; ++i) {
        const start = lineOffsets[i]
        if (offset < start) {
          const line = i - 1
          return { line, col: offset - lineOffsets[line] }
        }
        if (offset === start) return { line: i, col: 0 }
      }
    }
  }
  return { line: undefined, col: undefined }
}
