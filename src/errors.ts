import type { LineCounter } from './parse/line-counter'

export class YAMLError extends Error {
  name: 'YAMLParseError' | 'YAMLWarning'
  message: string
  offset: number
  linePos?: { line: number; col: number }

  constructor(name: YAMLError['name'], offset: number, message: string) {
    if (!message) throw new Error(`Invalid arguments for new ${name}`)
    super()
    this.name = name
    this.message = message
    this.offset = offset
  }
}

export class YAMLParseError extends YAMLError {
  constructor(offset: number, message: string) {
    super('YAMLParseError', offset, message)
  }
}

export class YAMLWarning extends YAMLError {
  constructor(offset: number, message: string) {
    super('YAMLWarning', offset, message)
  }
}

export const prettifyError = (src: string, lc: LineCounter) => (
  error: YAMLError
) => {
  if (error.offset === -1) return
  error.linePos = lc.linePos(error.offset)
  const { line, col } = error.linePos
  error.message += ` at line ${line}, column ${col}`

  let ci = col - 1
  let lineStr = src
    .substring(lc.lineStarts[line - 1], lc.lineStarts[line])
    .replace(/[\n\r]+$/, '')

  // Trim to max 80 chars, keeping col position near the middle
  if (ci >= 60 && lineStr.length > 80) {
    const trimStart = Math.min(ci - 39, lineStr.length - 79)
    lineStr = '…' + lineStr.substring(trimStart)
    ci -= trimStart - 1
  }
  if (lineStr.length > 80) lineStr = lineStr.substring(0, 79) + '…'

  // Include previous line in context if pointing at line start
  if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
    // Regexp won't match if start is trimmed
    let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1])
    if (prev.length > 80) prev = prev.substring(0, 79) + '…\n'
    lineStr = prev + lineStr
  }

  if (/[^ ]/.test(lineStr)) {
    const pointer = ' '.repeat(ci) + '^'
    error.message += `:\n\n${lineStr}\n${pointer}\n`
  }
}
