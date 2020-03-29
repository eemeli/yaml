// Type definitions for yaml 1.2
// Project: https://github.com/eemeli/yaml
// Definitions by: Ika <https://github.com/ikatyang>
//                 Colin Bradley <https://github.com/ColinBradley>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

import { CST } from './parse-cst'
import {
  AST,
  BinaryOptions,
  BoolOptions,
  IntOptions,
  NullOptions,
  Pair,
  Scalar,
  Schema,
  StrOptions,
  YAMLMap,
  YAMLSeq
} from './types'
import { Type, YAMLError, YAMLWarning } from './util'

export { default as parseCST } from './parse-cst'

/**
 * `yaml` defines document-specific options in three places: as an argument of
 * parse, create and stringify calls, in the values of `YAML.defaultOptions`,
 * and in the version-dependent `YAML.Document.defaults` object. Values set in
 * `YAML.defaultOptions` override version-dependent defaults, and argument
 * options override both.
 */
export const defaultOptions: Options

/**
 * Some customization options are availabe to control the parsing and
 * stringification of scalars. Note that these values are used by all documents.
 */
export const scalarOptions: {
  binary: BinaryOptions
  bool: BoolOptions
  int: IntOptions
  null: NullOptions
  str: StrOptions
}

/**
 * May throw on error, and it may log warnings using `console.warn`.
 * It only supports input consisting of a single YAML document;
 * for multi-document support you should use `YAML.parseAllDocuments`
 * @param str Should be a string with YAML formatting.
 * @returns The value will match the type of the root value of the parsed YAML document,
 *          so Maps become objects, Sequences arrays, and scalars result in nulls, booleans, numbers and strings.
 */
export function parse(str: string, options?: Options): any

/**
 * @returns Will always include \n as the last character, as is expected of YAML documents.
 */
export function stringify(value: any, options?: Options): string

/**
 * Parses a single YAML.Document from the input str; used internally by YAML.parse.
 * Will include an error if str contains more than one document.
 */
export function parseDocument(str: string, options?: Options): Document

/**
 * When parsing YAML, the input string str may consist of a stream of documents
 * separated from each other by `...` document end marker lines.
 * @returns An array of Document objects that allow these documents to be parsed and manipulated with more control.
 */
export function parseAllDocuments(str: string, options?: Options): Document[]

/**
 * Recursively turns objects into collections. Generic objects as well as `Map`
 * and its descendants become mappings, while arrays and other iterable objects
 * result in sequences.
 *
 * The primary purpose of this function is to enable attaching comments or other
 * metadata to a value, or to otherwise exert more fine-grained control over the
 * stringified output. To that end, you'll need to assign its return value to
 * the `contents` of a Document (or somewhere within said contents), as the
 * document's schema is required for YAML string output.
 *
 * @param wrapScalars If undefined or `true`, also wraps plain values in
 *   `Scalar` objects; if `false` and `value` is not an object, it will be
 *   returned directly.
 * @param tag Use to specify the collection type, e.g. `"!!omap"`. Note that
 *   this requires the corresponding tag to be available based on the default
 *   options. To use a specific document's schema, use `doc.schema.createNode`.
 */
export function createNode(
  value: any,
  wrapScalars?: true,
  tag?: string
): YAMLMap | YAMLSeq | Scalar

/**
 * YAML.createNode recursively turns objects into Map and arrays to Seq collections.
 * Its primary use is to enable attaching comments or other metadata to a value,
 * or to otherwise exert more fine-grained control over the stringified output.
 *
 * Doesn't wrap plain values in Scalar objects.
 */
export function createNode(
  value: any,
  wrapScalars: false,
  tag?: string
): YAMLMap | YAMLSeq | string | number | boolean | null

export interface Options {
  /**
   * Default prefix for anchors.
   *
   * Default: `'a'`, resulting in anchors `a1`, `a2`, etc.
   */
  anchorPrefix?: string
  /**
   * Array of additional tags to include in the schema, or a function that may
   * modify the schema's base tag array.
   */
  customTags?: (TagId | Tag)[] | ((tags: Tag[]) => Tag[])
  /**
   * Allow non-JSON JavaScript objects to remain in the `toJSON` output.
   * Relevant with the YAML 1.1 `!!timestamp` and `!!binary` tags as well as BigInts.
   *
   * Default: `true`
   */
  keepBlobsInJSON?: boolean
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
   * Enable support for `<<` merge keys.
   *
   * Default: `false` for YAML 1.2, `true` for earlier versions
   */
  merge?: boolean
  /**
   * Include line position & node type directly in errors; drop their verbose source and context.
   *
   * Default: `false`
   */
  prettyErrors?: boolean
  /**
   * The base schema to use.
   *
   * Default: `"core"` for YAML 1.2, `"yaml-1.1"` for earlier versions
   */
  schema?: 'core' | 'failsafe' | 'json' | 'yaml-1.1'
  /**
   * When stringifying, require keys to be scalars and to use implicit rather than explicit notation.
   *
   * Default: `false`
   */
  simpleKeys?: boolean
  /**
   * When stringifying, sort map entries. If `true`, sort by comparing key values with `<`.
   *
   * Default: `false`
   */
  sortMapEntries?: boolean | ((a: Pair, b: Pair) => number)
  /**
   * @deprecated Use `customTags` instead.
   */
  tags?: (TagId | Tag)[] | ((tags: Tag[]) => Tag[])
  /**
   * The YAML version used by documents without a `%YAML` directive.
   *
   * Default: `"1.2"`
   */
  version?: '1.0' | '1.1' | '1.2'
}

/**
 * @deprecated Use `Options` instead
 */
export type ParseOptions = Options

export type TagId =
  | 'binary'
  | 'bool'
  | 'float'
  | 'floatExp'
  | 'floatNaN'
  | 'floatTime'
  | 'int'
  | 'intHex'
  | 'intOct'
  | 'intTime'
  | 'null'
  | 'omap'
  | 'pairs'
  | 'set'
  | 'timestamp'

export type Tag = CustomTag | DefaultTag

interface BaseTag {
  /**
   * An optional factory function, used e.g. by collections when wrapping JS objects as AST nodes.
   */
  createNode?: (
    schema: Schema,
    value: any,
    ctx: Schema.CreateNodeContext
  ) => YAMLMap | YAMLSeq | Scalar
  /**
   * If a tag has multiple forms that should be parsed and/or stringified differently, use `format` to identify them.
   */
  format?: string
  /**
   * Used by `YAML.createNode` to detect your data type, e.g. using `typeof` or
   * `instanceof`.
   */
  identify(value: any): boolean
  /**
   * The `Node` child class that implements this tag. Required for collections and tags that have overlapping JS representations.
   */
  nodeClass?: new () => any
  /**
   * Used by some tags to configure their stringification, where applicable.
   */
  options?: object
  /**
   * Optional function stringifying the AST node in the current context. If your
   * data includes a suitable `.toString()` method, you can probably leave this
   * undefined and use the default stringifier.
   *
   * @param item The node being stringified.
   * @param ctx Contains the stringifying context variables.
   * @param onComment Callback to signal that the stringifier includes the
   *   item's comment in its output.
   * @param onChompKeep Callback to signal that the output uses a block scalar
   *   type with the `+` chomping indicator.
   */
  stringify?: (
    item: AST.Node,
    ctx: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ) => string
  /**
   * The identifier for your data type, with which its stringified form will be
   * prefixed. Should either be a !-prefixed local `!tag`, or a fully qualified
   * `tag:domain,date:foo`.
   */
  tag: string
}

export interface CustomTag extends BaseTag {
  /**
   * A JavaScript class that should be matched to this tag, e.g. `Date` for `!!timestamp`.
   * @deprecated Use `Tag.identify` instead
   */
  class?: new () => any
  /**
   * Turns a CST node into an AST node. If returning a non-`Node` value, the
   * output will be wrapped as a `Scalar`.
   */
  resolve(doc: Document, cstNode: CST.Node): AST.Node | any
}

export interface DefaultTag extends BaseTag {
  /**
   * If `true`, together with `test` allows for values to be stringified without
   * an explicit tag. For most cases, it's unlikely that you'll actually want to
   * use this, even if you first think you do.
   */
  default: true
  /**
   * Alternative form used by default tags; called with `test` match results.
   */
  resolve(...match: string[]): AST.Node | any
  /**
   * Together with `default` allows for values to be stringified without an
   * explicit tag and detected using a regular expression. For most cases, it's
   * unlikely that you'll actually want to use these, even if you first think
   * you do.
   */
  test: RegExp
}

export interface StringifyContext {
  forceBlockIndent?: boolean
  implicitKey?: boolean
  indent?: string
  indentAtStart?: number
  inFlow?: boolean
  [key: string]: any
}

export class Document {
  constructor(options?: Options)
  type: Type.DOCUMENT
  /**
   * Anchors associated with the document's nodes;
   * also provides alias & merge node creators.
   */
  anchors: Document.Anchors
  /**
   * A comment at the very beginning of the document.
   */
  commentBefore: null | string
  /**
   * A comment at the end of the document.
   */
  comment: null | string
  /**
   * only available when `keepCstNodes` is set to `true`
   */
  cstNode?: CST.Document
  /**
   * The document contents.
   */
  contents: AST.AstNode | null
  /**
   * Errors encountered during parsing.
   */
  errors: YAMLError[]
  /**
   * The schema used with the document.
   */
  schema: Schema
  /**
   * the [start, end] range of characters of the source parsed
   * into this node (undefined if not parsed)
   */
  range: null | [number, number]
  /**
   * a blank line before this node and its commentBefore
   */
  spaceBefore?: boolean
  /**
   * Array of prefixes; each will have a string `handle` that
   * starts and ends with `!` and a string `prefix` that the handle will be replaced by.
   */
  tagPrefixes: Document.TagPrefix[]
  /**
   * The parsed version of the source document;
   * if true-ish, stringified output will include a `%YAML` directive.
   */
  version?: string
  /**
   * Warnings encountered during parsing.
   */
  warnings: YAMLWarning[]
  /**
   * List the tags used in the document that are not in the default `tag:yaml.org,2002:` namespace.
   */
  listNonDefaultTags(): string[]
  /**
   * Parse a CST into this document
   */
  parse(cst: CST.Document): this
  /**
   * Set `handle` as a shorthand string for the `prefix` tag namespace.
   */
  setTagPrefix(handle: string, prefix: string): void
  /**
   * A plain JavaScript representation of the document `contents`.
   */
  toJSON(): any
  /**
   * A YAML representation of the document.
   */
  toString(): string
}

export namespace Document {
  interface Anchors {
    /**
     * Create a new `Alias` node, adding the required anchor for `node`.
     * If `name` is empty, a new anchor name will be generated.
     */
    createAlias(node: AST.Node, name?: string): AST.Alias
    /**
     * Create a new `Merge` node with the given source nodes.
     * Non-`Alias` sources will be automatically wrapped.
     */
    createMergePair(...nodes: AST.Node[]): AST.Merge
    /**
     * The anchor name associated with `node`, if set.
     */
    getName(node: AST.Node): undefined | string
    /**
     * The node associated with the anchor `name`, if set.
     */
    getNode(name: string): undefined | AST.Node
    /**
     * Find an available anchor name with the given `prefix` and a numerical suffix.
     */
    newName(prefix: string): string
    /**
     * Associate an anchor with `node`. If `name` is empty, a new name will be generated.
     * To remove an anchor, use `setAnchor(null, name)`.
     */
    setAnchor(node: AST.Node | null, name?: string): void | string
  }

  interface TagPrefix {
    handle: string
    prefix: string
  }
}
