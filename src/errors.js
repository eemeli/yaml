import Node from './cst/Node'

class YAMLError extends Error {
  constructor(name, source, message) {
    if (!message || !(source instanceof Node))
      throw new Error(`Invalid arguments for new ${name}`)
    super()
    this.name = name
    this.message = message
    this.source = source
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
