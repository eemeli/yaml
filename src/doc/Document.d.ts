import { Alias, Collection, Merge, Node, Pair } from '../ast'
import { Type } from '../constants'
import { YAMLError, YAMLWarning } from '../errors'
import { Options } from '../options'
import { Directives } from './directives'
import { Schema } from './Schema'

export type Replacer = any[] | ((key: any, value: any) => boolean)
export type Reviver = (key: any, value: any) => any

export interface CreateNodeOptions {
  onTagObj?: (tagObj: Schema.Tag) => void

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
  /**
   * Wrap plain values in `Scalar` objects.
   *
   * Default: `true`
   */
  wrapScalars?: boolean
}

export class Document extends Collection {
  // cstNode?: CST.Document
  /**
   * @param value - The initial value for the document, which will be wrapped
   *   in a Node container.
   */
  constructor(value?: any, options?: Options)
  constructor(value: any, replacer: null | Replacer, options?: Options)

  directives: Directives

  tag: never
  directivesEndMarker?: boolean
  type: Type.DOCUMENT
  /**
   * Anchors associated with the document's nodes;
   * also provides alias & merge node creators.
   */
  anchors: Document.Anchors
  /** The document contents. */
  contents: any
  /** Errors encountered during parsing. */
  errors: YAMLError[]
  /**
   * The schema used with the document. Use `setSchema()` to change or
   * initialise.
   */
  options: Required<Options>

  // FIXME required by Collection, currently optional in Document
  declare schema: Schema

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
  /** Warnings encountered during parsing. */
  warnings: YAMLWarning[]

  add(value: unknown): void
  delete(key: unknown): boolean
  get(key: unknown, keepScalar?: boolean): unknown
  has(key: unknown): boolean
  set(key: unknown, value: unknown): void

  /**
   * Convert any value into a `Node` using the current schema, recursively
   * turning objects into collections.
   */
  createNode(
    value: any,
    { replacer, tag, wrapScalars }?: CreateNodeOptions
  ): Node
  /**
   * Convert a key and a value into a `Pair` using the current schema,
   * recursively wrapping all values as `Scalar` or `Collection` nodes.
   *
   * @param options If `wrapScalars` is not `false`, wraps plain values in
   *   `Scalar` objects.
   */
  createPair(key: any, value: any, options?: { wrapScalars?: boolean }): Pair

  /**
   * When a document is created with `new YAML.Document()`, the schema object is
   * not set as it may be influenced by parsed directives; call this with no
   * arguments to set it manually, or with arguments to change the schema used
   * by the document.
   */
  setSchema(
    id?: Options['version'] | Schema.Name,
    customTags?: (Schema.TagId | Schema.Tag)[]
  ): void
  /** Set `handle` as a shorthand string for the `prefix` tag namespace. */
  setTagPrefix(handle: string, prefix: string): void
  /**
   * A plain JavaScript representation of the document `contents`.
   *
   * @param mapAsMap - Use Map rather than Object to represent mappings.
   *   Overrides values set in Document or global options.
   * @param onAnchor - If defined, called with the resolved `value` and
   *   reference `count` for each anchor in the document.
   * @param reviver - A function that may filter or modify the output JS value
   */
  toJS(opt?: {
    mapAsMap?: boolean
    onAnchor?: (value: any, count: number) => void
    reviver?: Reviver
  }): any
  /**
   * A JSON representation of the document `contents`.
   *
   * @param arg Used by `JSON.stringify` to indicate the array index or property
   *   name.
   */
  toJSON(arg?: string): any
  /** A YAML representation of the document. */
  toString(): string
}

export namespace Document {
  interface Parsed extends Document {
    contents: Node.Parsed | null
    range: [number, number]
    /** The schema used with the document. */
    schema: Schema
  }

  interface Anchors {
    /** @private */
    map: Record<string, Node>

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
    /** The anchor name associated with `node`, if set. */
    getName(node: Node): undefined | string
    /** List of all defined anchor names. */
    getNames(): string[]
    /** The node associated with the anchor `name`, if set. */
    getNode(name: string): undefined | Node
    /**
     * Find an available anchor name with the given `prefix` and a
     * numerical suffix.
     */
    newName(prefix?: string): string
    /**
     * Associate an anchor with `node`. If `name` is empty, a new name will be generated.
     * To remove an anchor, use `setAnchor(null, name)`.
     */
    setAnchor(node: Node | null, name?: string): void | string
  }

  interface TagPrefix {
    handle: string
    prefix: string
  }
}
