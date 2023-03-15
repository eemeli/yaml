import type { YAMLError, YAMLWarning } from '../errors.js'
import { Alias } from '../nodes/Alias.js'
import { collectionFromPath, isEmptyPath } from '../nodes/Collection.js'
import {
  DOC,
  isCollection,
  isNode,
  isScalar,
  NODE_TYPE
} from '../nodes/identity.js'
import type { Node, NodeType, ParsedNode, Range } from '../nodes/Node.js'
import { Pair } from '../nodes/Pair.js'
import type { Scalar } from '../nodes/Scalar.js'
import { toJS, ToJSContext } from '../nodes/toJS.js'
import type { YAMLMap } from '../nodes/YAMLMap.js'
import type { YAMLSeq } from '../nodes/YAMLSeq.js'
import type {
  CreateNodeOptions,
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
  ToStringOptions
} from '../options.js'
import { Schema } from '../schema/Schema.js'
import { stringifyDocument } from '../stringify/stringifyDocument.js'
import { anchorNames, createNodeAnchors, findNewAnchor } from './anchors.js'
import { applyReviver } from './applyReviver.js'
import { createNode, CreateNodeContext } from './createNode.js'
import { Directives } from './directives.js'

export type Replacer = any[] | ((key: any, value: any) => unknown)

export declare namespace Document {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  /** @ts-ignore The typing of directives fails in TS <= 4.2 */
  interface Parsed<
    Contents extends ParsedNode = ParsedNode,
    Strict extends boolean = true
  > extends Document<Contents, Strict> {
    directives: Directives
    range: Range
  }
}

export class Document<
  Contents extends Node = Node,
  Strict extends boolean = true
> {
  declare readonly [NODE_TYPE]: symbol

  /** A comment before this Document */
  commentBefore: string | null = null

  /** A comment immediately after this Document */
  comment: string | null = null

  /** The document contents. */
  contents: Strict extends true ? Contents | null : Contents

  directives: Strict extends true ? Directives | undefined : Directives

  /** Errors encountered during parsing. */
  errors: YAMLError[] = []

  options: Required<
    Omit<
      ParseOptions & DocumentOptions,
      '_directives' | 'lineCounter' | 'version'
    >
  >

  /**
   * The `[start, value-end, node-end]` character offsets for the part of the
   * source parsed into this document (undefined if not parsed). The `value-end`
   * and `node-end` positions are themselves not included in their respective
   * ranges.
   */
  declare range?: Range

  // TS can't figure out that setSchema() will set this, or throw
  /** The schema used with the document. Use `setSchema()` to change. */
  declare schema: Schema

  /** Warnings encountered during parsing. */
  warnings: YAMLWarning[] = []

  /**
   * @param value - The initial value for the document, which will be wrapped
   *   in a Node container.
   */
  constructor(
    value?: any,
    options?: DocumentOptions & SchemaOptions & ParseOptions & CreateNodeOptions
  )
  constructor(
    value: any,
    replacer: null | Replacer,
    options?: DocumentOptions & SchemaOptions & ParseOptions & CreateNodeOptions
  )
  constructor(
    value?: unknown,
    replacer?:
      | Replacer
      | (DocumentOptions & SchemaOptions & ParseOptions & CreateNodeOptions)
      | null,
    options?: DocumentOptions & SchemaOptions & ParseOptions & CreateNodeOptions
  ) {
    Object.defineProperty(this, NODE_TYPE, { value: DOC })
    let _replacer: Replacer | null = null
    if (typeof replacer === 'function' || Array.isArray(replacer)) {
      _replacer = replacer
    } else if (options === undefined && replacer) {
      options = replacer
      replacer = undefined
    }

    const opt = Object.assign(
      {
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: 'warn',
        prettyErrors: true,
        strict: true,
        uniqueKeys: true,
        version: '1.2'
      },
      options
    )
    this.options = opt
    let { version } = opt
    if (options?._directives) {
      this.directives = options._directives.atDocument()
      if (this.directives.yaml.explicit) version = this.directives.yaml.version
    } else this.directives = new Directives({ version })
    this.setSchema(version, options)

    // @ts-expect-error We can't really know that this matches Contents.
    this.contents =
      value === undefined ? null : this.createNode(value, _replacer, options)
  }

  /**
   * Create a deep copy of this Document and its contents.
   *
   * Custom Node values that inherit from `Object` still refer to their original instances.
   */
  clone(): Document<Contents, Strict> {
    const copy: Document<Contents, Strict> = Object.create(Document.prototype, {
      [NODE_TYPE]: { value: DOC }
    })
    copy.commentBefore = this.commentBefore
    copy.comment = this.comment
    copy.errors = this.errors.slice()
    copy.warnings = this.warnings.slice()
    copy.options = Object.assign({}, this.options)
    if (this.directives) copy.directives = this.directives.clone()
    copy.schema = this.schema.clone()
    // @ts-expect-error We can't really know that this matches Contents.
    copy.contents = isNode(this.contents)
      ? this.contents.clone(copy.schema)
      : this.contents
    if (this.range) copy.range = this.range.slice() as Document['range']
    return copy
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
   * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
   *
   * If `node` already has an anchor, `name` is ignored.
   * Otherwise, the `node.anchor` value will be set to `name`,
   * or if an anchor with that name is already present in the document,
   * `name` will be used as a prefix for a new unique anchor.
   * If `name` is undefined, the generated anchor will use 'a' as a prefix.
   */
  createAlias(
    node: Strict extends true ? Scalar | YAMLMap | YAMLSeq : Node,
    name?: string
  ): Alias {
    if (!node.anchor) {
      const prev = anchorNames(this)
      node.anchor =
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        !name || prev.has(name) ? findNewAnchor(name || 'a', prev) : name
    }
    return new Alias(node.anchor)
  }

  /**
   * Convert any value into a `Node` using the current schema, recursively
   * turning objects into collections.
   */
  createNode<T = unknown>(value: T, options?: CreateNodeOptions): NodeType<T>
  createNode<T = unknown>(
    value: T,
    replacer: Replacer | CreateNodeOptions | null,
    options?: CreateNodeOptions
  ): NodeType<T>
  createNode(
    value: unknown,
    replacer?: Replacer | CreateNodeOptions | null,
    options?: CreateNodeOptions
  ): Node {
    let _replacer: Replacer | undefined = undefined
    if (typeof replacer === 'function') {
      value = replacer.call({ '': value }, '', value)
      _replacer = replacer
    } else if (Array.isArray(replacer)) {
      const keyToStr = (v: unknown) =>
        typeof v === 'number' || v instanceof String || v instanceof Number
      const asStr = replacer.filter(keyToStr).map(String)
      if (asStr.length > 0) replacer = replacer.concat(asStr)
      _replacer = replacer
    } else if (options === undefined && replacer) {
      options = replacer
      replacer = undefined
    }

    const {
      aliasDuplicateObjects,
      anchorPrefix,
      flow,
      keepUndefined,
      onTagObj,
      tag
    } = options ?? {}
    const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(
      this,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      anchorPrefix || 'a'
    )
    const ctx: CreateNodeContext = {
      aliasDuplicateObjects: aliasDuplicateObjects ?? true,
      keepUndefined: keepUndefined ?? false,
      onAnchor,
      onTagObj,
      replacer: _replacer,
      schema: this.schema,
      sourceObjects
    }
    const node = createNode(value, tag, ctx)
    if (flow && isCollection(node)) node.flow = true
    setAnchors()
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
    const k = this.createNode(key, null, options) as K
    const v = this.createNode(value, null, options) as V
    return new Pair(k, v)
  }

  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  delete(key: unknown): boolean {
    return assertCollection(this.contents) ? this.contents.delete(key) : false
  }

  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path: Iterable<unknown> | null): boolean {
    if (isEmptyPath(path)) {
      if (this.contents == null) return false
      // @ts-expect-error Presumed impossible if Strict extends false
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
  get(key: unknown, keepScalar?: boolean): Strict extends true ? unknown : any {
    return isCollection(this.contents)
      ? this.contents.get(key, keepScalar)
      : undefined
  }

  /**
   * Returns item at `path`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(
    path: Iterable<unknown> | null,
    keepScalar?: boolean
  ): Strict extends true ? unknown : any {
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
  has(key: unknown): boolean {
    return isCollection(this.contents) ? this.contents.has(key) : false
  }

  /**
   * Checks if the document includes a value at `path`.
   */
  hasIn(path: Iterable<unknown> | null): boolean {
    if (isEmptyPath(path)) return this.contents !== undefined
    return isCollection(this.contents) ? this.contents.hasIn(path) : false
  }

  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(key: any, value: unknown): void {
    if (this.contents == null) {
      // @ts-expect-error We can't really know that this matches Contents.
      this.contents = collectionFromPath(this.schema, [key], value)
    } else if (assertCollection(this.contents)) {
      this.contents.set(key, value)
    }
  }

  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path: Iterable<unknown> | null, value: unknown): void {
    if (isEmptyPath(path)) {
      // @ts-expect-error We can't really know that this matches Contents.
      this.contents = value
    } else if (this.contents == null) {
      // @ts-expect-error We can't really know that this matches Contents.
      this.contents = collectionFromPath(this.schema, Array.from(path), value)
    } else if (assertCollection(this.contents)) {
      this.contents.setIn(path, value)
    }
  }

  /**
   * Change the YAML version and schema used by the document.
   * A `null` version disables support for directives, explicit tags, anchors, and aliases.
   * It also requires the `schema` option to be given as a `Schema` instance value.
   *
   * Overrides all previously set schema options.
   */
  setSchema(
    version: '1.1' | '1.2' | 'next' | null,
    options: SchemaOptions = {}
  ) {
    if (typeof version === 'number') version = String(version) as '1.1' | '1.2'

    let opt: (SchemaOptions & { schema: string }) | null
    switch (version) {
      case '1.1':
        if (this.directives) this.directives.yaml.version = '1.1'
        else this.directives = new Directives({ version: '1.1' })
        opt = { merge: true, resolveKnownTags: false, schema: 'yaml-1.1' }
        break
      case '1.2':
      case 'next':
        if (this.directives) this.directives.yaml.version = version
        else this.directives = new Directives({ version })
        opt = { merge: false, resolveKnownTags: true, schema: 'core' }
        break
      case null:
        if (this.directives) delete this.directives
        opt = null
        break
      default: {
        const sv = JSON.stringify(version)
        throw new Error(
          `Expected '1.1', '1.2' or null as first argument, but found: ${sv}`
        )
      }
    }

    // Not using `instanceof Schema` to allow for duck typing
    if (options.schema instanceof Object) this.schema = options.schema
    else if (opt) this.schema = new Schema(Object.assign(opt, options))
    else
      throw new Error(
        `With a null YAML version, the { schema: Schema } option is required`
      )
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
  }: ToJSOptions & { json?: boolean; jsonArg?: string | null } = {}): any {
    const ctx: ToJSContext = {
      anchors: new Map(),
      doc: this,
      keep: !json,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === 'number' ? maxAliasCount : 100
    }
    const res = toJS(this.contents, jsonArg ?? '', ctx)
    if (typeof onAnchor === 'function')
      for (const { count, res } of ctx.anchors.values()) onAnchor(res, count)
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
  toJSON(jsonArg?: string | null, onAnchor?: ToJSOptions['onAnchor']): any {
    return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor })
  }

  /** A YAML representation of the document. */
  toString(options: ToStringOptions = {}): string {
    if (this.errors.length > 0)
      throw new Error('Document with errors cannot be stringified')
    if (
      'indent' in options &&
      (!Number.isInteger(options.indent) || Number(options.indent) <= 0)
    ) {
      const s = JSON.stringify(options.indent)
      throw new Error(`"indent" option must be a positive integer, not ${s}`)
    }
    return stringifyDocument(this, options)
  }
}

function assertCollection(contents: unknown): contents is YAMLMap | YAMLSeq {
  if (isCollection(contents)) return true
  throw new Error('Expected a YAML collection as document contents')
}
