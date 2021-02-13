import { Type } from '../constants.js'

export const binaryOptions = {
  /**
   * The type of string literal used to stringify `!!binary` values.
   *
   * Default: `'BLOCK_LITERAL'`
   */
  defaultType: Type.BLOCK_LITERAL,

  /**
   * Maximum line width for `!!binary`.
   *
   * Default: `76`
   */
  lineWidth: 76
}

export const boolOptions = {
  /**
   * String representation for `true`.
   * With the core schema, use `true`, `True`, or `TRUE`.
   *
   * Default: `'true'`
   */
  trueStr: 'true',

  /**
   * String representation for `false`.
   * With the core schema, use `false`, `False`, or `FALSE`.
   *
   * Default: `'false'`
   */
  falseStr: 'false'
}

export const intOptions = {
  /**
   * Whether integers should be parsed into BigInt values.
   *
   * Default: `false`
   */
  asBigInt: false
}

export const nullOptions = {
  /**
   * String representation for `null`.
   * With the core schema, use `null`, `Null`, `NULL`, `~`, or an empty string.
   *
   * Default: `'null'`
   */
  nullStr: 'null'
}

export const strOptions = {
  /**
   * The default type of string literal used to stringify values in general
   *
   * Default: `'PLAIN'`
   */
  defaultType: Type.PLAIN,

  /**
   * The default type of string literal used to stringify implicit key values
   *
   * Default: `'PLAIN'`
   */
  defaultKeyType: Type.PLAIN,

  /**
   * Use 'single quote' rather than "double quote" by default
   *
   * Default: `false`
   */
  defaultQuoteSingle: false,

  doubleQuoted: {
    /**
     * Whether to restrict double-quoted strings to use JSON-compatible syntax.
     *
     * Default: `false`
     */
    jsonEncoding: false,

    /**
     * Minimum length to use multiple lines to represent the value.
     *
     * Default: `40`
     */
    minMultiLineLength: 40
  },

  fold: {
    /**
     * Maximum line width (set to `0` to disable folding).
     *
     * Default: `80`
     */
    lineWidth: 80,

    /**
     * Minimum width for highly-indented content.
     *
     * Default: `20`
     */
    minContentWidth: 20
  }
}
