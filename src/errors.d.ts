// import { Type } from './constants'

interface LinePos {
  line: number
  col: number
}

export class YAMLError extends Error {
  name: 'YAMLParseError' | 'YAMLWarning'
  message: string
  offset?: number

  // nodeType?: Type
  // range?: CST.Range
  // linePos?: { start: LinePos; end: LinePos }

  /**
   * Drops `source` and adds `nodeType`, `range` and `linePos`, as well as
   * adding details to `message`. Run automatically for document errors if
   * the `prettyErrors` option is set.
   */
  makePretty(): void
}

export class YAMLParseError extends YAMLError {
  name: 'YAMLParseError'
  constructor(source: number, message: string)
}

export class YAMLWarning extends YAMLError {
  name: 'YAMLWarning'
  constructor(source: number, message: string)
}
