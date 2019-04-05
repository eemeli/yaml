import Node from './cst/Node'

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
