import type { Pair } from '../nodes/Pair.ts'
import type { SchemaOptions, ToStringOptions } from '../options.ts'
import { map } from './common/map.ts'
import { seq } from './common/seq.ts'
import { string } from './common/string.ts'
import { coreKnownTags, getTags } from './tags.ts'
import type { CollectionTag, ScalarTag } from './types.ts'

const sortMapEntriesByKey = (a: Pair<any>, b: Pair<any>) =>
  a.key < b.key ? -1 : a.key > b.key ? 1 : 0

export class Schema {
  compat: Array<CollectionTag | ScalarTag> | null
  knownTags: Record<string, CollectionTag | ScalarTag>
  name: string
  sortMapEntries: ((a: Pair, b: Pair) => number) | null
  tags: Array<CollectionTag | ScalarTag>
  toStringOptions: Readonly<ToStringOptions> | null

  // These are used by createNode() and composeScalar()
  /** @internal */
  declare readonly map: typeof map
  /** @internal */
  declare readonly scalar: typeof string
  /** @internal */
  declare readonly seq: typeof seq

  constructor({
    compat,
    customTags,
    merge,
    resolveKnownTags,
    schema,
    sortMapEntries,
    toStringDefaults
  }: SchemaOptions) {
    this.compat = Array.isArray(compat)
      ? getTags(compat, 'compat')
      : compat
        ? getTags(null, compat)
        : null
    this.name = (typeof schema === 'string' && schema) || 'core'
    this.knownTags = resolveKnownTags ? coreKnownTags : {}
    this.tags = getTags(customTags, this.name, merge)
    this.toStringOptions = toStringDefaults ?? null

    Object.defineProperty(this, 'map', { value: map })
    Object.defineProperty(this, 'scalar', { value: string })
    Object.defineProperty(this, 'seq', { value: seq })

    // Used by createMap()
    this.sortMapEntries =
      typeof sortMapEntries === 'function'
        ? sortMapEntries
        : sortMapEntries === true
          ? sortMapEntriesByKey
          : null
  }

  clone(): Schema {
    const copy: Schema = Object.create(
      Schema.prototype,
      Object.getOwnPropertyDescriptors(this)
    )
    copy.tags = this.tags.slice()
    return copy
  }
}
