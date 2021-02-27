import { Alias } from '../ast/Alias.js'
import {
  collectionFromPath,
  isEmptyPath,
  toJS,
  ToJSContext
} from '../ast/index.js'
import { ToJSAnchorValue } from '../ast/toJS.js'
import {
  DOC,
  isCollection,
  isNode,
  isScalar,
  Node,
  NODE_TYPE,
  ParsedNode
} from '../ast/Node.js'
import { Pair } from '../ast/Pair.js'
import type { YAMLMap } from '../ast/YAMLMap.js'
import type { YAMLSeq } from '../ast/YAMLSeq.js'
import { Type } from '../constants.js'
import type { YAMLError, YAMLWarning } from '../errors.js'
import {
  DocumentOptions,
  Options,
  defaultOptions,
  documentOptions
} from '../options.js'
import { addComment } from '../stringify/addComment.js'
import { stringify, StringifyContext } from '../stringify/stringify.js'
import type { TagId, TagObj } from '../tags/types.js'

import { Anchors } from './Anchors.js'
import { Schema, SchemaName, SchemaOptions } from './Schema.js'
import { Reviver, applyReviver } from './applyReviver.js'
import { createNode, CreateNodeContext } from './createNode.js'
import { Directives } from './directives.js'

export type Replacer = any[] | ((key: any, value: any) => unknown)
export type { Anchors, Reviver }

export interface CreateNodeOptions {
  keepUndefined?: boolean | null

  onTagObj?: (tagObj: TagObj) => void

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

export interface ToJSOptions {
  json?: boolean
  jsonArg?: string | null
  mapAsMap?: boolean
  onAnchor?: (value: unknown, count: number) => void
  reviver?: Reviver
}

export declare namespace Document {
  interface Parsed extends Document {
    contents: ParsedNode | null
    range: [number, number]
    /** The schema used with the document. */
    schema: Schema
  }

  interface TagPrefix {
    handle: string
    prefix: string
  }
}

export class Document {
  static defaults = documentOptions;

  [NODE_TYPE] = DOC

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
  contents: unknown

  directives: Directives

  directivesEndMarker: boolean = false

  /** Errors encountered during parsing. */
  errors: YAMLError[] = []

  options: Required<DocumentOptions> & SchemaOptions

  /** The schema used with the document. Use `setSchema()` to change. */
  schema: Schema

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
    let _replacer: Replacer | undefined = undefined
    if (typeof replacer === 'function' || Array.isArray(replacer)) {
      _replacer = replacer
    } else if (options === undefined && replacer) {
      options = replacer
      replacer = undefined
    }

    this.options = Object.assign({}, defaultOptions, options)
    this.anchors = new Anchors(this.options.anchorPrefix)
    if (options?.directives) {
      this.directives = options.directives.atDocument()
      if (options.version && !this.directives.yaml.explicit)
        this.directives.yaml.version = options.version
    } else this.directives = new Directives({ version: this.options.version })

    const schemaOpts = Object.assign({}, this.getDefaults(), this.options)
    this.schema = new Schema(schemaOpts)

    this.contents =
      value === undefined
        ? null
        : this.createNode(value, { replacer: _replacer })
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

  getDefaults() {
    return (
      Document.defaults[this.directives.yaml.version] ||
      Document.defaults[this.options.version] ||
      {}
    )
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
      this.contents = collectionFromPath(this.schema, [key], value)
    } else if (assertCollection(this.contents)) {
      this.contents.set(key, value)
    }
  }

  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path: Iterable<unknown>, value: unknown) {
    if (isEmptyPath(path)) this.contents = value
    else if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, Array.from(path), value)
    } else if (assertCollection(this.contents)) {
      this.contents.setIn(path, value)
    }
  }

  /**
   * When a document is created with `new YAML.Document()`, the schema object is
   * not set as it may be influenced by parsed directives; call this with no
   * arguments to set it manually, or with arguments to change the schema used
   * by the document.
   */
  setSchema(
    id: Options['version'] | SchemaName | null,
    customTags?: (TagId | TagObj)[]
  ) {
    if (!id && !customTags) return

    // @ts-ignore Never happens in TypeScript
    if (typeof id === 'number') id = id.toFixed(1)

    if (id === '1.1' || id === '1.2') {
      this.directives.yaml.version = id
      delete this.options.schema
    } else if (id && typeof id === 'string') {
      this.options.schema = id
    }
    if (Array.isArray(customTags)) this.options.customTags = customTags
    const schemaOpts = Object.assign({}, this.getDefaults(), this.options)
    this.schema = new Schema(schemaOpts)
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

  /**
   * A plain JavaScript representation of the document `contents`.
   *
   * @param mapAsMap - Use Map rather than Object to represent mappings.
   *   Overrides values set in Document or global options.
   * @param onAnchor - If defined, called with the resolved `value` and
   *   reference `count` for each anchor in the document.
   * @param reviver - A function that may filter or modify the output JS value
   */
  toJS({ json, jsonArg, mapAsMap, onAnchor, reviver }: ToJSOptions = {}) {
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
      mapAsMap:
        typeof mapAsMap === 'boolean' ? mapAsMap : !!this.options.mapAsMap,
      mapKeyWarned: false,
      maxAliasCount: this.options.maxAliasCount,
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
  toString() {
    if (this.errors.length > 0)
      throw new Error('Document with errors cannot be stringified')
    const indentSize = this.options.indent
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
      indentStep: ' '.repeat(indentSize),
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
