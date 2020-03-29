// Type definitions for yaml 1.2
// Project: https://github.com/eemeli/yaml
// Definitions by: Ika <https://github.com/ikatyang>
//                 Colin Bradley <https://github.com/ColinBradley>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

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
  binary: ast.BinaryOptions
  bool: ast.BoolOptions
  int: ast.IntOptions
  null: ast.NullOptions
  str: ast.StrOptions
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
export function parseDocument(str: string, options?: Options): ast.Document

/**
 * When parsing YAML, the input string str may consist of a stream of documents
 * separated from each other by `...` document end marker lines.
 * @returns An array of Document objects that allow these documents to be parsed and manipulated with more control.
 */
export function parseAllDocuments(
  str: string,
  options?: Options
): ast.Document[]

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
): ast.MapBase | ast.SeqBase | ast.Scalar

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
): ast.MapBase | ast.SeqBase | string | number | boolean | null

export function parseCST(str: string): ParsedCST

export interface ParsedCST extends Array<cst.Document> {
  setOrigRanges(): boolean
}

export const Document: ast.DocumentConstructor

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
  sortMapEntries?: boolean | ((a: ast.Pair, b: ast.Pair) => number)
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
    schema: ast.Schema,
    value: any,
    ctx: CreateNodeContext
  ) => ast.MapBase | ast.SeqBase | ast.Scalar
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
    item: ast.Node,
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
  resolve(doc: ast.Document, cstNode: cst.Node): ast.Node | any
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
  resolve(...match: string[]): ast.Node | any
  /**
   * Together with `default` allows for values to be stringified without an
   * explicit tag and detected using a regular expression. For most cases, it's
   * unlikely that you'll actually want to use these, even if you first think
   * you do.
   */
  test: RegExp
}

export interface CreateNodeContext {
  wrapScalars?: boolean
  [key: string]: any
}

export interface StringifyContext {
  forceBlockIndent?: boolean
  implicitKey?: boolean
  indent?: string
  indentAtStart?: number
  inFlow?: boolean
  [key: string]: any
}

export type YAMLError = YAMLSyntaxError | YAMLSemanticError | YAMLReferenceError

export interface YAMLSyntaxError extends SyntaxError {
  name: 'YAMLSyntaxError'
  source: cst.Node
}

export interface YAMLSemanticError extends SyntaxError {
  name: 'YAMLSemanticError'
  source: cst.Node
}

export interface YAMLReferenceError extends ReferenceError {
  name: 'YAMLReferenceError'
  source: cst.Node
}

export interface YAMLWarning extends Error {
  name: 'YAMLReferenceError'
  source: cst.Node
}

export namespace cst {
  interface Range {
    start: number
    end: number
    origStart?: number
    origEnd?: number
    isEmpty(): boolean
  }

  interface ParseContext {
    /** Node starts at beginning of line */
    atLineStart: boolean
    /** true if currently in a collection context */
    inCollection: boolean
    /** true if currently in a flow context */
    inFlow: boolean
    /** Current level of indentation */
    indent: number
    /** Start of the current line */
    lineStart: number
    /** The parent of the node */
    parent: Node
    /** Source of the YAML document */
    src: string
  }

  interface Node {
    context: ParseContext | null
    /** if not null, indicates a parser failure */
    error: YAMLSyntaxError | null
    /** span of context.src parsed into this node */
    range: Range | null
    valueRange: Range | null
    /** anchors, tags and comments */
    props: Range[]
    /** specific node type */
    type: string
    /** if non-null, overrides source value */
    value: string | null

    readonly anchor: string | null
    readonly comment: string | null
    readonly hasComment: boolean
    readonly hasProps: boolean
    readonly jsonLike: boolean
    readonly rawValue: string | null
    readonly tag:
      | null
      | { verbatim: string }
      | { handle: string; suffix: string }
    readonly valueRangeContainsNewline: boolean
  }

  interface Alias extends Node {
    type: 'ALIAS'
    /** contain the anchor without the * prefix */
    readonly rawValue: string
  }

  type Scalar = BlockValue | PlainValue | QuoteValue

  interface BlockValue extends Node {
    type: 'BLOCK_FOLDED' | 'BLOCK_LITERAL'
    chomping: 'CLIP' | 'KEEP' | 'STRIP'
    blockIndent: number | null
    header: Range
    readonly strValue: string | null
  }

  interface BlockFolded extends BlockValue {
    type: 'BLOCK_FOLDED'
  }

  interface BlockLiteral extends BlockValue {
    type: 'BLOCK_LITERAL'
  }

  interface PlainValue extends Node {
    type: 'PLAIN'
    readonly strValue: string | null
  }

  interface QuoteValue extends Node {
    type: 'QUOTE_DOUBLE' | 'QUOTE_SINGLE'
    readonly strValue:
      | null
      | string
      | { str: string; errors: YAMLSyntaxError[] }
  }

  interface QuoteDouble extends QuoteValue {
    type: 'QUOTE_DOUBLE'
  }

  interface QuoteSingle extends QuoteValue {
    type: 'QUOTE_SINGLE'
  }

  interface Comment extends Node {
    type: 'COMMENT'
    readonly anchor: null
    readonly comment: string
    readonly rawValue: null
    readonly tag: null
  }

  interface BlankLine extends Node {
    type: 'BLANK_LINE'
  }

  interface MapItem extends Node {
    type: 'MAP_KEY' | 'MAP_VALUE'
    node: ContentNode | null
  }

  interface MapKey extends MapItem {
    type: 'MAP_KEY'
  }

  interface MapValue extends MapItem {
    type: 'MAP_VALUE'
  }

  interface Map extends Node {
    type: 'MAP'
    /** implicit keys are not wrapped */
    items: Array<BlankLine | Comment | Alias | Scalar | MapItem>
  }

  interface SeqItem extends Node {
    type: 'SEQ_ITEM'
    node: ContentNode | null
  }

  interface Seq extends Node {
    type: 'SEQ'
    items: Array<BlankLine | Comment | SeqItem>
  }

  interface FlowChar {
    char: '{' | '}' | '[' | ']' | ',' | '?' | ':'
    offset: number
    origOffset?: number
  }

  interface FlowCollection extends Node {
    type: 'FLOW_MAP' | 'FLOW_SEQ'
    items: Array<
      FlowChar | BlankLine | Comment | Alias | Scalar | FlowCollection
    >
  }

  interface FlowMap extends FlowCollection {
    type: 'FLOW_MAP'
  }

  interface FlowSeq extends FlowCollection {
    type: 'FLOW_SEQ'
  }

  type ContentNode = Alias | Scalar | Map | Seq | FlowCollection

  interface Directive extends Node {
    type: 'DIRECTIVE'
    name: string
    readonly anchor: null
    readonly parameters: string[]
    readonly tag: null
  }

  interface Document extends Node {
    type: 'DOCUMENT'
    directives: Array<BlankLine | Comment | Directive>
    contents: Array<BlankLine | Comment | ContentNode>
    readonly anchor: null
    readonly comment: null
    readonly tag: null
  }
}

export namespace ast {
  type AstNode = ScalarNode | MapNode | SeqNode | Alias

  type DocumentConstructor = new (options?: Options) => Document
  interface Document {
    type: 'DOCUMENT'
    /**
     * Anchors associated with the document's nodes;
     * also provides alias & merge node creators.
     */
    anchors: Anchors
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
    cstNode?: cst.Document
    /**
     * The document contents.
     */
    contents: AstNode | null
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
    tagPrefixes: Prefix[]
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
    parse(cst: cst.Document): this
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

  interface Anchors {
    /**
     * Create a new `Alias` node, adding the required anchor for `node`.
     * If `name` is empty, a new anchor name will be generated.
     */
    createAlias(node: Node, name?: string): Alias
    /**
     * Create a new `Merge` node with the given source nodes.
     * Non-`Alias` sources will be automatically wrapped.
     */
    createMergePair(...nodes: Node[]): Merge
    /**
     * The anchor name associated with `node`, if set.
     */
    getName(node: Node): undefined | string
    /**
     * The node associated with the anchor `name`, if set.
     */
    getNode(name: string): undefined | Node
    /**
     * Find an available anchor name with the given `prefix` and a numerical suffix.
     */
    newName(prefix: string): string
    /**
     * Associate an anchor with `node`. If `name` is empty, a new name will be generated.
     * To remove an anchor, use `setAnchor(null, name)`.
     */
    setAnchor(node: Node | null, name?: string): void | string
  }

  class Schema {
    /** Default: `'tag:yaml.org,2002:'` */
    static defaultPrefix: string
    static defaultTags: {
      /** Default: `'tag:yaml.org,2002:map'` */
      MAP: string
      /** Default: `'tag:yaml.org,2002:seq'` */
      SEQ: string
      /** Default: `'tag:yaml.org,2002:str'` */
      STR: string
    }
    constructor(options: Options)
    /**
     * Convert any value into a `Node` using this schema, recursively turning
     * objects into collectsions.
     *
     * @param wrapScalars If undefined or `true`, also wraps plain values in
     *   `Scalar` objects; if `false` and `value` is not an object, it will be
     *   returned directly.
     * @param tag Use to specify the collection type, e.g. `"!!omap"`. Note that
     *   this requires the corresponding tag to be available in this schema.
     */
    createNode(
      value: any,
      wrapScalars: boolean,
      tag?: string,
      ctx?: CreateNodeContext
    ): Node
    merge: boolean
    name: 'core' | 'failsafe' | 'json' | 'yaml-1.1'
    sortMapEntries: ((a: Pair, b: Pair) => number) | null
    tags: Tag[]
  }

  interface Prefix {
    handle: string
    prefix: string
  }

  interface Node {
    /**
     * a comment on or immediately after this
     */
    comment: null | string
    /**
     * a comment before this
     */
    commentBefore: null | string
    /**
     * only available when `keepCstNodes` is set to `true`
     */
    cstNode?: cst.Node
    /**
     * the [start, end] range of characters of the source parsed
     * into this node (undefined for pairs or if not parsed)
     */
    range: null | [number, number]
    /**
     * a blank line before this node and its commentBefore
     */
    spaceBefore?: boolean
    /**
     * a fully qualified tag, if required
     */
    tag: null | string
    /**
     * a plain JS representation of this node
     */
    toJSON(): any
  }

  type ScalarType =
    | 'BLOCK_FOLDED'
    | 'BLOCK_LITERAL'
    | 'PLAIN'
    | 'QUOTE_DOUBLE'
    | 'QUOTE_SINGLE'
  type ScalarConstructor = new (
    value: null | boolean | number | string
  ) => Scalar
  interface Scalar extends Node {
    type: ScalarType | undefined
    /**
     * By default (undefined), numbers use decimal notation.
     * The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
     */
    format: 'BIN' | 'HEX' | 'OCT' | 'TIME' | undefined
    value: null | boolean | number | string
  }

  type ScalarNode =
    | BlockFolded
    | BlockLiteral
    | PlainValue
    | QuoteDouble
    | QuoteSingle

  interface BlockFolded extends Scalar {
    type: 'BLOCK_FOLDED'
    cstNode?: cst.BlockFolded
  }

  interface BlockLiteral extends Scalar {
    type: 'BLOCK_LITERAL'
    cstNode?: cst.BlockLiteral
  }

  interface PlainValue extends Scalar {
    type: 'PLAIN'
    cstNode?: cst.PlainValue
  }

  interface QuoteDouble extends Scalar {
    type: 'QUOTE_DOUBLE'
    cstNode?: cst.QuoteDouble
  }

  interface QuoteSingle extends Scalar {
    type: 'QUOTE_SINGLE'
    cstNode?: cst.QuoteSingle
  }

  type PairConstructor = new (
    key: AstNode | null,
    value?: AstNode | null
  ) => Pair
  interface Pair extends Node {
    type: 'PAIR'
    /**
     * key is always Node or null when parsed, but can be set to anything.
     */
    key: AstNode | null
    /**
     * value is always Node or null when parsed, but can be set to anything.
     */
    value: AstNode | null
    cstNode?: never // no corresponding cstNode
  }

  type MapConstructor = new () => MapBase
  interface MapBase extends Node {
    type: 'FLOW_MAP' | 'MAP' | undefined
    items: Array<Pair | Merge>
  }

  type MapNode = FlowMap | Map

  interface FlowMap extends MapBase {
    type: 'FLOW_MAP'
    cstNode?: cst.FlowMap
  }

  interface Map extends MapBase {
    type: 'MAP'
    cstNode?: cst.Map
  }

  type SeqConstructor = new () => SeqBase
  interface SeqBase extends Node {
    type: 'FLOW_SEQ' | 'SEQ' | undefined
    /**
     * item is always Node or null when parsed, but can be set to anything.
     */
    items: Array<AstNode | Pair | null>
  }

  type SeqNode = FlowSeq | Seq

  interface FlowSeq extends SeqBase {
    type: 'FLOW_SEQ'
    items: Array<AstNode | Pair>
    cstNode?: cst.FlowSeq
  }

  interface Seq extends SeqBase {
    type: 'SEQ'
    items: Array<AstNode | null>
    cstNode?: cst.Seq
  }

  interface Alias extends Node {
    type: 'ALIAS'
    source: AstNode
    cstNode?: cst.Alias
  }

  interface Merge extends Node {
    type: 'MERGE_PAIR'
    /**
     * key is always Scalar('<<'), defined by the type specification
     */
    key: PlainValue
    /**
     * value is always Seq<Alias(Map)>, stringified as *A if length = 1
     */
    value: SeqBase
    cstNode?: cst.PlainValue
  }

  interface BinaryOptions {
    /**
     * The type of string literal used to stringify `!!binary` values.
     *
     * Default: `'BLOCK_LITERAL'`
     */
    defaultType: ScalarType
    /**
     * Maximum line width for `!!binary`.
     *
     * Default: `76`
     */
    lineWidth: number
  }

  interface BoolOptions {
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

  interface IntOptions {
    /**
     * Whether integers should be parsed into BigInt values.
     *
     * Default: `false`
     */
    asBigInt: false
  }

  interface NullOptions {
    /**
     * String representation for `null`. With the core schema, use `'null' | 'Null' | 'NULL' | '~' | ''`.
     *
     * Default: `'null'`
     */
    nullStr: string
  }

  interface StrOptions {
    /**
     * The default type of string literal used to stringify values
     *
     * Default: `'PLAIN'`
     */
    defaultType: ScalarType
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
