import { LogLevelId } from './constants.js'
import type { Reviver } from './doc/applyReviver.js'
import type { Directives } from './doc/directives.js'
import type { Replacer } from './doc/Document.js'
import type { SchemaName } from './doc/Schema.js'
import type { Pair } from './nodes/Pair.js'
import type { LineCounter } from './parse/line-counter.js'
import {
  binaryOptions,
  boolOptions,
  intOptions,
  nullOptions,
  strOptions
} from './tags/options.js'
import type { CollectionTag, ScalarTag, TagValue } from './tags/types.js'

export type ParseOptions = {
  /**
   * If set, newlines will be tracked, to allow for `lineCounter.linePos(offset)`
   * to provide the `{ line, col }` positions within the input.
   */
  lineCounter?: LineCounter

  /**
   * Include line/col position & node type directly in parse errors.
   *
   * Default: `true`
   */
  prettyErrors?: boolean

  /**
   * Detect and report errors that are required by the YAML 1.2 spec,
   * but are caused by unambiguous content.
   *
   * Default: `true`
   */
  strict?: boolean
}

export type DocumentOptions = {
  /**
   * Default prefix for anchors.
   *
   * Default: `'a'`, resulting in anchors `a1`, `a2`, etc.
   */
  anchorPrefix?: string

  /**
   * Used internally by Composer. If set and includes an explicit version,
   * that overrides the `version` option.
   */
  directives?: Directives

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
   * The YAML version used by documents without a `%YAML` directive.
   *
   * Default: `"1.2"`
   */
  version?: '1.1' | '1.2'
}

export type SchemaOptions = {
  /**
   * Array of additional tags to include in the schema, or a function that may
   * modify the schema's base tag array.
   */
  customTags?: TagValue[] | ((tags: TagValue[]) => TagValue[]) | null

  /**
   * Enable support for `<<` merge keys.
   *
   * Default: `false` for YAML 1.2, `true` for earlier versions
   */
  merge?: boolean

  /**
   * When using the `'core'` schema, support parsing values with these
   * explicit YAML 1.1 tags:
   *
   * `!!binary`, `!!omap`, `!!pairs`, `!!set`, `!!timestamp`.
   *
   * Default `true`
   */
  resolveKnownTags?: boolean

  /**
   * The base schema to use.
   *
   * Default: `"core"` for YAML 1.2, `"yaml-1.1"` for earlier versions
   */
  schema?: SchemaName

  /**
   * When adding to or stringifying a map, sort the entries.
   * If `true`, sort by comparing key values with `<`.
   *
   * Default: `false`
   */
  sortMapEntries?: boolean | ((a: Pair, b: Pair) => number)
}

export type CreateNodeOptions = {
  keepUndefined?: boolean | null

  onTagObj?: (tagObj: ScalarTag | CollectionTag) => void

  /**
   * Filter or modify values while creating a node.
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter
   */
  replacer?: Replacer

  /**
   * Specify the collection type, e.g. `"!!omap"`. Note that this requires the
   * corresponding tag to be available in this document's schema.
   */
  tag?: string
}

export type ToJSOptions = {
  /**
   * Use Map rather than Object to represent mappings.
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
   * If defined, called with the resolved `value` and reference `count` for
   * each anchor in the document.
   */
  onAnchor?: (value: unknown, count: number) => void

  /**
   * Optional function that may filter or modify the output JS value
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#using_the_reviver_parameter
   */
  reviver?: Reviver
}

export type ToStringOptions = {
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
   * Require keys to be scalars and to use implicit rather than explicit notation.
   *
   * Default: `false`
   */
  simpleKeys?: boolean
}

export type Options = ParseOptions & DocumentOptions & SchemaOptions

/**
 * `yaml` defines document-specific options in three places: as an argument of
 * parse, create and stringify calls, in the values of `YAML.defaultOptions`,
 * and in the version-dependent `YAML.Document.defaults` object. Values set in
 * `YAML.defaultOptions` override version-dependent defaults, and argument
 * options override both.
 */
export const defaultOptions: Required<
  Omit<ParseOptions, 'lineCounter'> & Omit<DocumentOptions, 'directives'>
> = {
  anchorPrefix: 'a',
  keepUndefined: false,
  logLevel: 'warn',
  prettyErrors: true,
  strict: true,
  version: '1.2'
}

/**
 * Some customization options are availabe to control the parsing and
 * stringification of scalars. Note that these values are used by all documents.
 */
export const scalarOptions = {
  get binary() {
    return binaryOptions
  },
  set binary(opt) {
    Object.assign(binaryOptions, opt)
  },
  get bool() {
    return boolOptions
  },
  set bool(opt) {
    Object.assign(boolOptions, opt)
  },
  get int() {
    return intOptions
  },
  set int(opt) {
    Object.assign(intOptions, opt)
  },
  get null() {
    return nullOptions
  },
  set null(opt) {
    Object.assign(nullOptions, opt)
  },
  get str() {
    return strOptions
  },
  set str(opt) {
    Object.assign(strOptions, opt)
  }
}
