import { Type } from '../constants.js'

export const binaryOptions = {
  /**
   * The type of string literal used to stringify `!!binary` values.
   *
   * Default: `'BLOCK_LITERAL'`
   */
  defaultType: Type.BLOCK_LITERAL as
    | Type.BLOCK_FOLDED
    | Type.BLOCK_LITERAL
    | Type.PLAIN
    | Type.QUOTE_DOUBLE
    | Type.QUOTE_SINGLE,

  /**
   * Maximum line width for `!!binary`.
   *
   * Default: `76`
   */
  lineWidth: 76
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
  }
}
