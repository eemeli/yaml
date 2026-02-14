import type { YAMLError, YAMLWarning } from '../errors.ts'
import { Alias } from '../nodes/Alias.ts'
import type { Primitive } from '../nodes/Collection.ts'
import { isCollection } from '../nodes/identity.ts'
import type { Node, NodeType, Range } from '../nodes/Node.ts'
import type { Pair } from '../nodes/Pair.ts'
import type { Scalar } from '../nodes/Scalar.ts'
import { ToJSContext } from '../nodes/toJS.ts'
import type { YAMLMap } from '../nodes/YAMLMap.ts'
import type { YAMLSeq } from '../nodes/YAMLSeq.ts'
import type {
  CreateNodeOptions,
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
  ToStringOptions
} from '../options.ts'
import { Schema } from '../schema/Schema.ts'
import { stringifyDocument } from '../stringify/stringifyDocument.ts'
import { anchorNames, findNewAnchor } from './anchors.ts'
import { applyReviver } from './applyReviver.ts'
import { Directives } from './directives.ts'
import { NodeCreator } from './NodeCreator.ts'

export type DocValue = Scalar | YAMLSeq | YAMLMap

export type Replacer = any[] | ((key: any, value: any) => unknown)

export declare namespace Document {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  /** @ts-ignore The typing of directives fails in TS <= 4.2 */
  interface Parsed<
    Value extends DocValue = DocValue,
    Strict extends boolean = true
  > extends Document<Value, Strict> {
    directives: Directives
    range: Range
  }
}

export class Document<
  Value extends DocValue = DocValue,
  Strict extends boolean = true
> {
  /** A comment before this Document */
  commentBefore: string | null = null

  /** A comment immediately after this Document */
  comment: string | null = null

  /** The document value. */
  value: Value

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
        stringKeys: false,
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

    this.value = this.createNode(value, _replacer, options) as Value
  }

  /**
   * Create a deep copy of this Document and its value.
   *
   * Custom Node values that inherit from `Object` still refer to their original instances.
   */
  clone(): Document<Value, Strict> {
    const copy: Document<Value, Strict> = Object.create(Document.prototype)
    copy.commentBefore = this.commentBefore
    copy.comment = this.comment
    copy.errors = this.errors.slice()
    copy.warnings = this.warnings.slice()
    copy.options = Object.assign({}, this.options)
    if (this.directives) copy.directives = this.directives.clone()
    copy.schema = this.schema.clone()
    copy.value = this.value.clone(copy.schema) as Value
    if (this.range) copy.range = this.range.slice() as Document['range']
    return copy
  }

  /** Adds a value to the document. */
  add(value: any): void {
    assertCollection(this.value).add(value)
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
    node: Strict extends true ? DocValue : Node,
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
    let nc: NodeCreator
    if (typeof replacer === 'function') {
      value = replacer.call({ '': value }, '', value)
      nc = new NodeCreator(this, options, replacer)
    } else if (Array.isArray(replacer)) {
      const keyToStr = (v: unknown) =>
        typeof v === 'number' || v instanceof String || v instanceof Number
      const asStr = replacer.filter(keyToStr).map(String)
      if (asStr.length > 0) replacer = [...replacer, ...asStr]
      nc = new NodeCreator(this, options, replacer)
    } else {
      options ??= replacer ?? undefined
      nc = new NodeCreator(this, options)
    }
    const node = nc.create(value, options?.tag)
    nc.setAnchors()
    return node
  }

  /**
   * Convert a key and a value into a `Pair` using the current schema,
   * recursively wrapping all values as `Scalar` or `Collection` nodes.
   */
  createPair<K = unknown, V = unknown>(
    key: K,
    value: V,
    options: CreateNodeOptions = {}
  ): Pair<
    K extends Primitive | Node ? K : Node,
    V extends Primitive | Node ? V : Node
  > {
    const nc = new NodeCreator(this, options)
    const pair = nc.createPair(key, value) as Pair<
      K extends Primitive | Node ? K : Node,
      V extends Primitive | Node ? V : Node
    >
    nc.setAnchors()
    return pair
  }

  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  delete(key: any): boolean {
    return assertCollection(this.value).delete(key)
  }

  /**
   * Returns item at `key`, or `undefined` if not found.
   */
  get(key?: any): Strict extends true ? Node | Pair | undefined : any {
    if (key === undefined) return this.value
    return isCollection(this.value) ? this.value.get(key) : undefined
  }

  /**
   * Checks if the document includes a value with the key `key`.
   */
  has(key: any): boolean {
    return isCollection(this.value) ? this.value.has(key) : false
  }

  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(key: any, value: any): void {
    assertCollection(this.value).set(key, value)
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
  ): void {
    if (typeof version === 'number') version = String(version) as '1.1' | '1.2'

    let opt: (SchemaOptions & { schema: string }) | null
    switch (version) {
      case '1.1':
        if (this.directives) this.directives.yaml.version = '1.1'
        else this.directives = new Directives({ version: '1.1' })
        opt = { resolveKnownTags: false, schema: 'yaml-1.1' }
        break
      case '1.2':
      case 'next':
        if (this.directives) this.directives.yaml.version = version
        else this.directives = new Directives({ version })
        opt = { resolveKnownTags: true, schema: 'core' }
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

  /** A plain JavaScript representation of the document `value`. */
  toJS(opt: ToJSOptions = {}): any {
    const { onAnchor, reviver } = opt
    const ctx = new ToJSContext(opt)
    const res = this.value.toJS(this, ctx)
    if (typeof onAnchor === 'function')
      for (const { count, res } of ctx.anchors.values()) onAnchor(res, count)
    return typeof reviver === 'function'
      ? applyReviver(reviver, { '': res }, '', res)
      : res
  }

  /** A JSON representation of the document `value`.  */
  toJSON(): any {
    return this.toJS({ mapAsMap: false })
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

function assertCollection(value: unknown) {
  if (isCollection(value)) return value
  throw new Error('Expected a YAML collection as document value')
}
