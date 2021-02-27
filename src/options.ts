import { LogLevelId, defaultTagPrefix } from './constants.js'
import type { SchemaOptions } from './doc/Schema.js'
import type { LineCounter } from './parse/line-counter.js'
import {
  binaryOptions,
  boolOptions,
  intOptions,
  nullOptions,
  strOptions
} from './tags/options.js'

export interface DocumentOptions {
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
   * If set, newlines will be tracked while parsing, to allow for
   * `lineCounter.linePos(offset)` to provide the `{ line, col }` positions
   * within the input.
   */
  lineCounter?: LineCounter | null

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
  version?: '1.1' | '1.2'
}

export type Options = DocumentOptions & SchemaOptions

/**
 * `yaml` defines document-specific options in three places: as an argument of
 * parse, create and stringify calls, in the values of `YAML.defaultOptions`,
 * and in the version-dependent `YAML.Document.defaults` object. Values set in
 * `YAML.defaultOptions` override version-dependent defaults, and argument
 * options override both.
 */
export const defaultOptions: Required<DocumentOptions> = {
  anchorPrefix: 'a',
  indent: 2,
  indentSeq: true,
  keepCstNodes: false,
  keepNodeTypes: true,
  keepUndefined: false,
  lineCounter: null,
  logLevel: 'warn',
  mapAsMap: false,
  maxAliasCount: 100,
  prettyErrors: true,
  simpleKeys: false,
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

export const documentOptions = {
  '1.0': {
    schema: 'yaml-1.1',
    merge: true,
    tagPrefixes: [
      { handle: '!', prefix: defaultTagPrefix },
      { handle: '!!', prefix: 'tag:private.yaml.org,2002:' }
    ]
  },
  1.1: {
    schema: 'yaml-1.1',
    merge: true,
    tagPrefixes: [
      { handle: '!', prefix: '!' },
      { handle: '!!', prefix: defaultTagPrefix }
    ]
  },
  1.2: {
    schema: 'core',
    merge: false,
    resolveKnownTags: true,
    tagPrefixes: [
      { handle: '!', prefix: '!' },
      { handle: '!!', prefix: defaultTagPrefix }
    ]
  }
}
