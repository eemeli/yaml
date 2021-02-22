import type { Pair } from '../ast/Pair.js'
import { schemas, tags } from '../tags/index.js'
import type { Tag, TagId } from '../tags/types.js'
import { Directives } from './directives.js'
import { getSchemaTags } from './getSchemaTags.js'

export type SchemaName = 'core' | 'failsafe' | 'json' | 'yaml-1.1'

export interface SchemaOptions {
  /**
   * Array of additional tags to include in the schema, or a function that may
   * modify the schema's base tag array.
   */
  customTags?:
    | Array<TagId | Tag>
    | ((tags: Array<TagId | Tag>) => Array<TagId | Tag>)
    | null

  directives?: Directives

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
   * When stringifying, sort map entries. If `true`, sort by comparing key values with `<`.
   *
   * Default: `false`
   */
  sortMapEntries?: boolean | ((a: Pair, b: Pair) => number)
}

const sortMapEntriesByKey = (a: Pair<any>, b: Pair<any>) =>
  a.key < b.key ? -1 : a.key > b.key ? 1 : 0

const coreKnownTags = {
  'tag:yaml.org,2002:binary': tags.binary,
  'tag:yaml.org,2002:omap': tags.omap,
  'tag:yaml.org,2002:pairs': tags.pairs,
  'tag:yaml.org,2002:set': tags.set,
  'tag:yaml.org,2002:timestamp': tags.timestamp
}

export class Schema {
  knownTags: Record<string, Tag>
  merge: boolean
  name: SchemaName
  sortMapEntries: ((a: Pair, b: Pair) => number) | null
  tags: Tag[]

  // Used by createNode(), to avoid circular dependencies
  map = tags.map
  seq = tags.seq

  constructor({
    customTags,
    merge,
    resolveKnownTags,
    schema,
    sortMapEntries
  }: SchemaOptions) {
    this.merge = !!merge
    this.name = schema || 'core'
    this.knownTags = resolveKnownTags ? coreKnownTags : {}
    this.tags = getSchemaTags(schemas, tags, customTags, this.name)

    // Used by createMap()
    this.sortMapEntries =
      sortMapEntries === true ? sortMapEntriesByKey : sortMapEntries || null
  }
}
