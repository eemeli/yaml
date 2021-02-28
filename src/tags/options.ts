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
}
