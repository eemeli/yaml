import { Type } from '../constants.js'
import type { YAMLError, YAMLWarning } from '../errors.js'
import { Alias } from '../nodes/Alias.js'
import { collectionFromPath, isEmptyPath } from '../nodes/Collection.js'
import {
  DOC,
  isCollection,
  isNode,
  isScalar,
  Node,
  NODE_TYPE,
  ParsedNode
} from '../nodes/Node.js'
import { Pair } from '../nodes/Pair.js'
import { toJS, ToJSAnchorValue, ToJSContext } from '../nodes/toJS.js'
import type { YAMLMap } from '../nodes/YAMLMap.js'
import type { YAMLSeq } from '../nodes/YAMLSeq.js'
import {
  CreateNodeOptions,
  defaultOptions,
  DocumentOptions,
  Options,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
  ToStringOptions
} from '../options.js'
import { addComment } from '../stringify/addComment.js'
import { stringify, StringifyContext } from '../stringify/stringify.js'
import { Anchors } from './Anchors.js'
import { Schema } from './Schema.js'
import { applyReviver } from './applyReviver.js'
import { createNode, CreateNodeContext } from './createNode.js'
import { Directives } from './directives.js'

export type Replacer = any[] | ((key: any, value: any) => unknown)

export declare namespace Document {
  interface Parsed<T extends ParsedNode = ParsedNode> extends Document<T> {
    range: [number, number]
    /** The schema used with the document. */
    schema: Schema
  }

  interface TagPrefix {
    handle: string
    prefix: string
  }
}

export class Document<T = unknown> {
  readonly [NODE_TYPE]: symbol

  /**
   * Anchors associated with the document's nodes;
   * also provides alias & merge node creators.
   */
  anchors: Anchors

  /** A comment before this Document */
  commentBefore: string | null = null

  /** A comment immediately after this Document */
  comment: string | null = null

  /** The document contents. */
  contents: T | null

  directives: Directives

  directivesEndMarker = false

  /** Errors encountered during parsing. */
  errors: YAMLError[] = []

  options: Required<
    Omit<
      ParseOptions & DocumentOptions,
      'lineCounter' | 'directives' | 'version'
    >
  >

  // TS can't figure out that setSchema() will set this, or throw
  /** The schema used with the document. Use `setSchema()` to change. */
  declare schema: Schema

  /**
   * Array of prefixes; each will have a string `handle` that
   * starts and ends with `!` and a string `prefix` that the handle will be replaced by.
   */
  tagPrefixes: Document.TagPrefix[] = []

  type: Type.DOCUMENT = Type.DOCUMENT

  /**
   * The parsed version of the source document;
   * if true-ish, stringified output will include a `%YAML` directive.
   */
  version?: string

  /** Warnings encountered during parsing. */
  warnings: YAMLWarning[] = []

  /**
   * @param value - The initial value for the document, which will be wrapped
   *   in a Node container.
   */
  constructor(value?: any, options?: Options)
  constructor(value: any, replacer: null | Replacer, options?: Options)
  constructor(
    value?: unknown,
    replacer?: Replacer | Options | null,
    options?: Options
  ) {
    Object.defineProperty(this, NODE_TYPE, { value: DOC })
    let _replacer: Replacer | undefined = undefined
    if (typeof replacer === 'function' || Array.isArray(replacer)) {
      _replacer = replacer
    } else if (options === undefined && replacer) {
      options = replacer
      replacer = undefined
    }

    const opt = Object.assign({}, defaultOptions, options)
    this.options = opt
    this.anchors = new Anchors(this.options.anchorPrefix)
    let { version } = opt
    if (options?.directives) {
      this.directives = options.directives.atDocument()
      if (this.directives.yaml.explicit) version = this.directives.yaml.version
    } else this.directives = new Directives({ version })
    this.setSchema(version, options)

    this.contents =
      value === undefined
        ? null
        : ((this.createNode(value, { replacer: _replacer }) as unknown) as T)
  }

  /** Adds a value to the document. */
  add(value: any) {
    if (assertCollection(this.contents)) this.contents.add(value)
  }

  /** Adds a value to the document. */
  addIn(path: Iterable<unknown>, value: unknown) {
    if (assertCollection(this.contents)) this.contents.addIn(path, value)
  }

  /**
   * Convert any value into a `Node` using the current schema, recursively
   * turning objects into collections.
   */
  createNode(
    value: unknown,
    { keepUndefined, onTagObj, replacer, tag }: CreateNodeOptions = {}
  ): Node {
    if (typeof replacer === 'function')
      value = replacer.call({ '': value }, '', value)
    else if (Array.isArray(replacer)) {
      const keyToStr = (v: unknown) =>
        typeof v === 'number' || v instanceof String || v instanceof Number
      const asStr = replacer.filter(keyToStr).map(String)
      if (asStr.length > 0) replacer = replacer.concat(asStr)
    }
    if (typeof keepUndefined !== 'boolean')
      keepUndefined = !!this.options.keepUndefined
    const aliasNodes: Alias[] = []
    const ctx: CreateNodeContext = {
      keepUndefined,
      onAlias(source) {
        // These get fixed later in createNode()
        const alias = new Alias((source as unknown) as Node)
        aliasNodes.push(alias)
        return alias
      },
      onTagObj,
      prevObjects: new Map(),
      replacer,
      schema: this.schema
    }
    const node = createNode(value, tag, ctx)
    for (const alias of aliasNodes) {
      // With circular references, the source node is only resolved after all of
      // its child nodes are. This is why anchors are set only after all of the
      // nodes have been created.
      alias.source = (alias.source as any).node as Node
      let name = this.anchors.getName(alias.source)
      if (!name) {
        name = this.anchors.newName()
        this.anchors.map[name] = alias.source
      }
    }
    return node
  }

  /**
   * Convert a key and a value into a `Pair` using the current schema,
   * recursively wrapping all values as `Scalar` or `Collection` nodes.
   */
  createPair<K extends Node = Node, V extends Node = Node>(
    key: unknown,
    value: unknown,
    options: CreateNodeOptions = {}
  ) {
    const k = this.createNode(key, options) as K
    const v = this.createNode(value, options) as V
    return new Pair(k, v)
  }

  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  delete(key: any) {
    return assertCollection(this.contents) ? this.contents.delete(key) : false
  }

  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path: Iterable<unknown>) {
    if (isEmptyPath(path)) {
      if (this.contents == null) return false
      this.contents = null
      return true
    }
    return assertCollection(this.contents)
      ? this.contents.deleteIn(path)
      : false
  }

  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  get(key: unknown, keepScalar?: boolean) {
    return isCollection(this.contents)
      ? this.contents.get(key, keepScalar)
      : undefined
  }

  /**
   * Returns item at `path`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path: Iterable<unknown>, keepScalar?: boolean) {
    if (isEmptyPath(path))
      return !keepScalar && isScalar(this.contents)
        ? this.contents.value
        : this.contents
    return isCollection(this.contents)
      ? this.contents.getIn(path, keepScalar)
      : undefined
  }

  /**
   * Checks if the document includes a value with the key `key`.
   */
  has(key: unknown) {
    return isCollection(this.contents) ? this.contents.has(key) : false
  }

  /**
   * Checks if the document includes a value at `path`.
   */
  hasIn(path: Iterable<unknown>) {
    if (isEmptyPath(path)) return this.contents !== undefined
    return isCollection(this.contents) ? this.contents.hasIn(path) : false
  }

  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(key: any, value: unknown) {
    if (this.contents == null) {
      this.contents = (collectionFromPath(
        this.schema,
        [key],
        value
      ) as unknown) as T
    } else if (assertCollection(this.contents)) {
      this.contents.set(key, value)
    }
  }

  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path: Iterable<unknown>, value: unknown) {
    if (isEmptyPath(path)) this.contents = (value as unknown) as T
    else if (this.contents == null) {
      this.contents = (collectionFromPath(
        this.schema,
        Array.from(path),
        value
      ) as unknown) as T
    } else if (assertCollection(this.contents)) {
      this.contents.setIn(path, value)
    }
  }

  /**
   * Change the YAML version and schema used by the document.
   *
   * Overrides all previously set schema options
   */
  setSchema(version: '1.1' | '1.2', options?: SchemaOptions) {
    let _options: SchemaOptions
    switch (String(version)) {
      case '1.1':
        this.directives.yaml.version = '1.1'
        _options = Object.assign(
          { merge: true, resolveKnownTags: false, schema: 'yaml-1.1' },
          options
        )
        break
      case '1.2':
        this.directives.yaml.version = '1.2'
        _options = Object.assign(
          { merge: false, resolveKnownTags: true, schema: 'core' },
          options
        )
        break
      default: {
        const sv = JSON.stringify(version)
        throw new Error(`Expected '1.1' or '1.2' as version, but found: ${sv}`)
      }
    }
    this.schema = new Schema(_options)
  }

  /** Set `handle` as a shorthand string for the `prefix` tag namespace. */
  setTagPrefix(handle: string, prefix: string | null) {
    if (handle[0] !== '!' || handle[handle.length - 1] !== '!')
      throw new Error('Handle must start and end with !')
    if (prefix) {
      const prev = this.tagPrefixes.find(p => p.handle === handle)
      if (prev) prev.prefix = prefix
      else this.tagPrefixes.push({ handle, prefix })
    } else {
      this.tagPrefixes = this.tagPrefixes.filter(p => p.handle !== handle)
    }
  }

  /** A plain JavaScript representation of the document `contents`. */
  toJS(opt?: ToJSOptions & { [ignored: string]: unknown }): any

  // json & jsonArg are only used from toJSON()
  toJS({
    json,
    jsonArg,
    mapAsMap,
    maxAliasCount,
    onAnchor,
    reviver
  }: ToJSOptions & { json?: boolean; jsonArg?: string | null } = {}) {
    const anchorNodes = Object.values(this.anchors.map).map(
      node =>
        [node, { alias: [], aliasCount: 0, count: 1 }] as [
          Node,
          ToJSAnchorValue
        ]
    )
    const anchors = anchorNodes.length > 0 ? new Map(anchorNodes) : null
    const ctx: ToJSContext = {
      anchors,
      doc: this,
      indentStep: '  ',
      keep: !json,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100,
      stringify
    }
    const res = toJS(this.contents, jsonArg || '', ctx)
    if (typeof onAnchor === 'function' && anchors)
      for (const { count, res } of anchors.values()) onAnchor(res, count)
    return typeof reviver === 'function'
      ? applyReviver(reviver, { '': res }, '', res)
      : res
  }

  /**
   * A JSON representation of the document `contents`.
   *
   * @param jsonArg Used by `JSON.stringify` to indicate the array index or
   *   property name.
   */
  toJSON(jsonArg?: string | null, onAnchor?: ToJSOptions['onAnchor']) {
    return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor })
  }

  /** A YAML representation of the document. */
  toString({ indent, indentSeq, simpleKeys }: ToStringOptions = {}) {
    if (this.errors.length > 0)
      throw new Error('Document with errors cannot be stringified')

    const indentSize = typeof indent === 'number' ? indent : 2
    if (!Number.isInteger(indentSize) || indentSize <= 0) {
      const s = JSON.stringify(indentSize)
      throw new Error(`"indent" option must be a positive integer, not ${s}`)
    }

    const lines = []
    let hasDirectives = false
    const dir = this.directives.toString(this)
    if (dir) {
      lines.push(dir)
      hasDirectives = true
    }
    if (hasDirectives || this.directivesEndMarker) lines.push('---')
    if (this.commentBefore) {
      if (hasDirectives || !this.directivesEndMarker) lines.unshift('')
      lines.unshift(this.commentBefore.replace(/^/gm, '#'))
    }
    const ctx: StringifyContext = {
      anchors: Object.create(null),
      doc: this,
      indent: '',
      indentSeq: indentSeq !== false, // default true
      indentStep: ' '.repeat(indentSize),
      simpleKeys: simpleKeys === true, // default false
      stringify // Requiring directly in nodes would create circular dependencies
    }
    let chompKeep = false
    let contentComment = null
    if (this.contents) {
      if (isNode(this.contents)) {
        if (
          this.contents.spaceBefore &&
          (hasDirectives || this.directivesEndMarker)
        )
          lines.push('')
        if (this.contents.commentBefore)
          lines.push(this.contents.commentBefore.replace(/^/gm, '#'))
        // top-level block scalars need to be indented if followed by a comment
        ctx.forceBlockIndent = !!this.comment
        contentComment = this.contents.comment
      }
      const onChompKeep = contentComment ? undefined : () => (chompKeep = true)
      let body = stringify(
        this.contents,
        ctx,
        () => (contentComment = null),
        onChompKeep
      )
      if (contentComment) body = addComment(body, '', contentComment)
      if (
        (body[0] === '|' || body[0] === '>') &&
        lines[lines.length - 1] === '---'
      ) {
        // Top-level block scalars with a preceding doc marker ought to use the
        // same line for their header.
        lines[lines.length - 1] = `--- ${body}`
      } else lines.push(body)
    } else {
      lines.push(stringify(this.contents, ctx))
    }
    if (this.comment) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== '')
        lines.push('')
      lines.push(this.comment.replace(/^/gm, '#'))
    }
    return lines.join('\n') + '\n'
  }
}

function assertCollection(contents: unknown): contents is YAMLMap | YAMLSeq {
  if (isCollection(contents)) return true
  throw new Error('Expected a YAML collection as document contents')
}
