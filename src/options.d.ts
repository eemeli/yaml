import { Scalar } from './ast'
import { LogLevelId } from './constants'
import { Schema } from './doc/Schema'

/**
 * `yaml` defines document-specific options in three places: as an argument of
 * parse, create and stringify calls, in the values of `YAML.defaultOptions`,
 * and in the version-dependent `YAML.Document.defaults` object. Values set in
 * `YAML.defaultOptions` override version-dependent defaults, and argument
 * options override both.
 */
export const defaultOptions: Options

export interface Options extends Schema.Options {
  /**
   * Default prefix for anchors.
   *
   * Default: `'a'`, resulting in anchors `a1`, `a2`, etc.
   */
  anchorPrefix?: string
  /**
   * The number of spaces to use when indenting code.
   *
   * Default: `2`
   */
  indent?: number
  /**
   * Whether block sequences should be indented.
   *
   * Default: `true`
   */
  indentSeq?: boolean
  /**
   * Include references in the AST to each node's corresponding CST node.
   *
   * Default: `false`
   */
  keepCstNodes?: boolean
  /**
   * Store the original node type when parsing documents.
   *
   * Default: `true`
   */
  keepNodeTypes?: boolean
  /**
   * Keep `undefined` object values when creating mappings and return a Scalar
   * node when calling `YAML.stringify(undefined)`, rather than `undefined`.
   *
   * Default: `false`
   */
  keepUndefined?: boolean
  /**
   * Control the logging level during parsing
   *
   * Default: `'warn'`
   */
  logLevel?: LogLevelId
  /**
   * When outputting JS, use Map rather than Object to represent mappings.
   *
   * Default: `false`
   */
  mapAsMap?: boolean
  /**
   * Prevent exponential entity expansion attacks by limiting data aliasing count;
   * set to `-1` to disable checks; `0` disallows all alias nodes.
   *
   * Default: `100`
   */
  maxAliasCount?: number
  /**
   * Include line position & node type directly in errors; drop their verbose source and context.
   *
   * Default: `true`
   */
  prettyErrors?: boolean
  /**
   * When stringifying, require keys to be scalars and to use implicit rather than explicit notation.
   *
   * Default: `false`
   */
  simpleKeys?: boolean
  /**
   * When parsing, do not ignore errors required by the YAML 1.2 spec, but caused by unambiguous content.
   *
   * Default: `true`
   */
  strict?: boolean
  /**
   * The YAML version used by documents without a `%YAML` directive.
   *
   * Default: `"1.2"`
   */
  version?: '1.0' | '1.1' | '1.2'
}

/**
 * Some customization options are availabe to control the parsing and
 * stringification of scalars. Note that these values are used by all documents.
 */
export const scalarOptions: {
  binary: scalarOptions.Binary
  bool: scalarOptions.Bool
  int: scalarOptions.Int
  null: scalarOptions.Null
  str: scalarOptions.Str
}
export namespace scalarOptions {
  interface Binary {
    /**
     * The type of string literal used to stringify `!!binary` values.
     *
     * Default: `'BLOCK_LITERAL'`
     */
    defaultType: Scalar.Type
    /**
     * Maximum line width for `!!binary`.
     *
     * Default: `76`
     */
    lineWidth: number
  }

  interface Bool {
    /**
     * String representation for `true`. With the core schema, use `'true' | 'True' | 'TRUE'`.
     *
     * Default: `'true'`
     */
    trueStr: string
    /**
     * String representation for `false`. With the core schema, use `'false' | 'False' | 'FALSE'`.
     *
     * Default: `'false'`
     */
    falseStr: string
  }

  interface Int {
    /**
     * Whether integers should be parsed into BigInt values.
     *
     * Default: `false`
     */
    asBigInt: boolean
  }

  interface Null {
    /**
     * String representation for `null`. With the core schema, use `'null' | 'Null' | 'NULL' | '~' | ''`.
     *
     * Default: `'null'`
     */
    nullStr: string
  }

  interface Str {
    /**
     * The default type of string literal used to stringify values in general
     *
     * Default: `'PLAIN'`
     */
    defaultType: Scalar.Type
    /**
     * The default type of string literal used to stringify implicit key values
     *
     * Default: `'PLAIN'`
     */
    defaultKeyType: Scalar.Type
    /**
     * Use 'single quote' rather than "double quote" by default
     *
     * Default: `false`
     */
    defaultQuoteSingle: boolean
    doubleQuoted: {
      /**
       * Whether to restrict double-quoted strings to use JSON-compatible syntax.
       *
       * Default: `false`
       */
      jsonEncoding: boolean
      /**
       * Minimum length to use multiple lines to represent the value.
       *
       * Default: `40`
       */
      minMultiLineLength: number
    }
    fold: {
      /**
       * Maximum line width (set to `0` to disable folding).
       *
       * Default: `80`
       */
      lineWidth: number
      /**
       * Minimum width for highly-indented content.
       *
       * Default: `20`
       */
      minContentWidth: number
    }
  }
}
