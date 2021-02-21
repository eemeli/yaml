import { Node, Pair, Scalar, YAMLMap, YAMLSeq } from '../ast'
import { StringifyContext } from '../stringify/stringify'
import { CreateNodeContext } from './createNode'

export class Schema {
  constructor(options: Schema.Options)
  knownTags: { [key: string]: Schema.Tag }
  merge: boolean
  map: Schema.Tag
  name: Schema.Name
  seq: Schema.Tag
  sortMapEntries: ((a: Pair, b: Pair) => number) | null
  tags: Schema.Tag[]
}

export namespace Schema {
  type Name = 'core' | 'failsafe' | 'json' | 'yaml-1.1'

  interface Options {
    /**
     * Array of additional tags to include in the schema, or a function that may
     * modify the schema's base tag array.
     */
    customTags?: (TagId | Tag)[] | ((tags: Tag[]) => Tag[]) | null
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
    schema?: Name
    /**
     * When stringifying, sort map entries. If `true`, sort by comparing key values with `<`.
     *
     * Default: `false`
     */
    sortMapEntries?: boolean | ((a: Pair, b: Pair) => number)
    /**
     * @deprecated Use `customTags` instead.
     */
    tags?: Options['customTags']
  }

  type TagId =
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

  interface Tag {
    /**
     * An optional factory function, used e.g. by collections when wrapping JS objects as AST nodes.
     */
    createNode?: (
      schema: Schema,
      value: any,
      ctx: CreateNodeContext
    ) => YAMLMap | YAMLSeq | Scalar
    /**
     * If `true`, together with `test` allows for values to be stringified without
     * an explicit tag. For most cases, it's unlikely that you'll actually want to
     * use this, even if you first think you do.
     */
    default: boolean
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
     * Turns a value into an AST node.
     * If returning a non-`Node` value, the output will be wrapped as a `Scalar`.
     */
    resolve(
      value: string | YAMLMap | YAMLSeq,
      onError: (message: string) => void
    ): Node | any
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
      item: Node,
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
    /**
     * Together with `default` allows for values to be stringified without an
     * explicit tag and detected using a regular expression. For most cases, it's
     * unlikely that you'll actually want to use these, even if you first think
     * you do.
     */
    test?: RegExp
  }
}
