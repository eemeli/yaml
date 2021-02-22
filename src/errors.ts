// import { Type } from './constants.js'
// interface LinePos { line: number; col: number }

export class YAMLError extends Error {
  name: 'YAMLParseError' | 'YAMLWarning'
  message: string
  offset?: number

  // nodeType?: Type
  // range?: CST.Range
  // linePos?: { start: LinePos; end: LinePos }

  constructor(name: YAMLError['name'], offset: number | null, message: string) {
    if (!message) throw new Error(`Invalid arguments for new ${name}`)
    super()
    this.name = name
    this.message = message
    if (typeof offset === 'number') this.offset = offset
  }

  /**
   * Drops `source` and adds `nodeType`, `range` and `linePos`, as well as
   * adding details to `message`. Run automatically for document errors if
   * the `prettyErrors` option is set.
   */
  makePretty() {
    // this.nodeType = this.source.type
    // const cst = this.source.context && this.source.context.root
    // if (typeof this.offset === 'number') {
    //   this.range = new Range(this.offset, this.offset + 1)
    //   const start = cst && getLinePos(this.offset, cst)
    //   if (start) {
    //     const end = { line: start.line, col: start.col + 1 }
    //     this.linePos = { start, end }
    //   }
    //   delete this.offset
    // } else {
    //   this.range = this.source.range
    //   this.linePos = this.source.rangeAsLinePos
    // }
    // if (this.linePos) {
    //   const { line, col } = this.linePos.start
    //   this.message += ` at line ${line}, column ${col}`
    //   const ctx = cst && getPrettyContext(this.linePos, cst)
    //   if (ctx) this.message += `:\n\n${ctx}\n`
    // }
  }
}

export class YAMLParseError extends YAMLError {
  constructor(offset: number | null, message: string) {
    super('YAMLParseError', offset, message)
  }
}

export class YAMLWarning extends YAMLError {
  constructor(offset: number | null, message: string) {
    super('YAMLWarning', offset, message)
  }
}
