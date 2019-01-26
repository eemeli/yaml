function findLineStarts(src) {
  const ls = [0]
  let offset = src.indexOf('\n')
  while (offset !== -1) {
    offset += 1
    ls.push(offset)
    offset = src.indexOf('\n', offset)
  }
  return ls
}

export default function getLinePos(offset, cst) {
  if (typeof offset === 'number' && offset >= 0) {
    let lineStarts
    if (typeof cst === 'string') {
      lineStarts = findLineStarts(cst)
    } else {
      if (Array.isArray(cst)) cst = cst[0] // accept array of CST documents
      if (cst) {
        if (!cst.lineStarts) cst.lineStarts = findLineStarts(cst.context.src)
        lineStarts = cst.lineStarts
      }
    }
    if (lineStarts) {
      for (let i = 0; i < lineStarts.length; ++i) {
        const start = lineStarts[i]
        if (offset < start) {
          const line = i - 1
          return { line, col: offset - lineStarts[line] }
        }
        if (offset === start) return { line: i, col: 0 }
      }
    }
  }
  return { line: undefined, col: undefined }
}
