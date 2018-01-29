export class YAMLReferenceError extends ReferenceError {
  constructor (source, message) {
    super()
    this.message = message
    this.source = source
  }
}

export class YAMLSyntaxError extends SyntaxError {
  constructor (source, message) {
    super()
    this.message = message
    this.source = source
  }
}

export class YAMLWarning extends Error {
  constructor (source, message) {
    super()
    this.message = message
    this.source = source
  }
}
