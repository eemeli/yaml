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

/**
 * Determine the line/col position matching a character offset.
 *
 * Accepts a source string or a CST document as the second parameter. With
 * the latter, starting indices for lines are cached in the document as
 * `lineStarts: number[]`.
 *
 * Returns a zero-indexed `{ line, col }` location if found, or
 * `undefined` otherwise.
 *
 * @param {number} offset
 * @param {string|Document|Document[]} cst
 * @returns {{ line: number, col: number }|undefined}
 */
export default function getLinePos(offset, cst) {
  if (typeof offset === 'number' && offset >= 0) {
    let lineStarts, srcLength
    if (typeof cst === 'string') {
      lineStarts = findLineStarts(cst)
      srcLength = cst.length
    } else {
      if (Array.isArray(cst)) cst = cst[0]
      if (cst) {
        if (!cst.lineStarts) cst.lineStarts = findLineStarts(cst.context.src)
        lineStarts = cst.lineStarts
        srcLength = cst.context.src.length
      }
    }
    if (lineStarts && offset <= srcLength) {
      for (let i = 0; i < lineStarts.length; ++i) {
        const start = lineStarts[i]
        if (offset < start) {
          const line = i - 1
          return { line, col: offset - lineStarts[line] }
        }
        if (offset === start) return { line: i, col: 0 }
      }
      const line = lineStarts.length - 1
      return { line, col: offset - lineStarts[line] }
    }
  }
  return undefined
}
