import Node from './cst/Node'
import { getPrettyContext } from './cst/source-utils'

export class YAMLError extends Error {
  constructor(name, source, message) {
    if (!message || !(source instanceof Node))
      throw new Error(`Invalid arguments for new ${name}`)
    super()
    this.name = name
    this.message = message
    this.source = source
  }

  makePretty() {
    if (this.source) {
      this.nodeType = this.source.type
      this.range = this.source.range
      this.linePos = this.source.rangeAsLinePos
      if (this.linePos) {
        const { line, col } = this.linePos.start
        this.message += ` at line ${line}, column ${col}`
        const cst = this.source.context && this.source.context.root
        const ctx = cst && getPrettyContext(this.linePos, cst)
        if (ctx) this.message += `:\n\n${ctx}\n`
      }
      delete this.source
    }
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
