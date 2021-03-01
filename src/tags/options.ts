import { Type } from '../constants.js'

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
