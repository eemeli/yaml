export class YAMLError extends Error {
  constructor(name, offset, message) {
    if (!message) throw new Error(`Invalid arguments for new ${name}`)
    super()
    this.name = name
    this.message = message
    if (typeof offset === 'number') this.offset = offset
  }

  makePretty() {
    if (!this.source) return
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
    delete this.source
  }
}

export class YAMLParseError extends YAMLError {
  constructor(source, message) {
    super('YAMLParseError', source, message)
  }
}

export class YAMLReferenceError extends YAMLError {
  constructor(source, message) {
    super('YAMLReferenceError', source, message)
  }
}

export class YAMLSemanticError extends YAMLError {
  constructor(source, message) {
    super('YAMLSemanticError', source, message)
  }
}

export class YAMLSyntaxError extends YAMLError {
  constructor(source, message) {
    super('YAMLSyntaxError', source, message)
  }
}

export class YAMLWarning extends YAMLError {
  constructor(source, message) {
    super('YAMLWarning', source, message)
  }
}
