import Node from './ast/Node'

export class YAMLReferenceError extends ReferenceError {
  constructor(source, message) {
    if (!message || !(source instanceof Node)) {
      throw new Error('Invalid arguments for new YAMLReferenceError')
    }
    super()
    this.name = 'YAMLReferenceError'
    this.message = message
    this.source = source
  }
}

export class YAMLSemanticError extends SyntaxError {
  constructor(source, message) {
    if (!message || !(source instanceof Node)) {
      throw new Error('Invalid arguments for new YAMLSemanticError')
    }
    super()
    this.name = 'YAMLSemanticError'
    this.message = message
    this.source = source
  }
}

export class YAMLSyntaxError extends SyntaxError {
  constructor(source, message) {
    if (!message || !(source instanceof Node)) {
      throw new Error('Invalid arguments for new YAMLSyntaxError')
    }
    super()
    this.name = 'YAMLSyntaxError'
    this.message = message
    this.source = source
  }
}

export class YAMLWarning extends Error {
  constructor(source, message) {
    if (!message || !(source instanceof Node)) {
      throw new Error('Invalid arguments for new YAMLWarning')
    }
    super()
    this.name = 'YAMLWarning'
    this.message = message
    this.source = source
  }
}
