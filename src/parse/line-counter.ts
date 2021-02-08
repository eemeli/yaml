export class LineCounter {
  lineStarts: number[] = []

  /**
   * Should be called in ascending order. Otherwise, call
   * `lineCounter.lineStarts.sort()` before calling `linePos()`.
   */
  addNewLine = (offset: number) => this.lineStarts.push(offset)

  // linePos = (offset: number) => {
  //   for (let i = this.lineStarts.length - 1; i >= 0; --i) {
  //     const start = this.lineStarts[i]
  //     if (start <= offset) return { line: i + 1, col: offset - start + 1 }
  //   }
  //   return { line: 0, col: offset }
  // }

  /**
   * Performs a binary search and returns the 1-indexed { line, col }
   * position of `offset`. If `line === 0`, `addNewLine` has never been
   * called or `offset` is before the first known newline.
   */
  linePos = (offset: number) => {
    let low = 0
    let high = this.lineStarts.length
    while (low < high) {
      const mid = (low + high) >> 1 // Math.floor((low + high) / 2)
      if (this.lineStarts[mid] < offset) low = mid + 1
      else high = mid
    }
    if (low === 0) return { line: 0, col: offset }
    if (this.lineStarts[low] === offset) return { line: low + 1, col: 1 }
    const start = this.lineStarts[low - 1]
    return { line: low, col: offset - start + 1 }
  }
}
