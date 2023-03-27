import { MAP, SCALAR, SEQ } from '../nodes/identity.js'
import type { Pair } from '../nodes/Pair.js'
import type { SchemaOptions, ToStringOptions } from '../options.js'
import { map } from './common/map.js'
import { seq } from './common/seq.js'
import { string } from './common/string.js'
import { coreKnownTags, getTags } from './tags.js'
import type { CollectionTag, ScalarTag } from './types.js'

const sortMapEntriesByKey = (a: Pair<any>, b: Pair<any>) =>
  a.key < b.key ? -1 : a.key > b.key ? 1 : 0

export class Schema {
  compat: Array<CollectionTag | ScalarTag> | null
  knownTags: Record<string, CollectionTag | ScalarTag>
  merge: boolean
  name: string
  sortMapEntries: ((a: Pair, b: Pair) => number) | null
  tags: Array<CollectionTag | ScalarTag>
  toStringOptions: Readonly<ToStringOptions> | null;

  // Used by createNode() and composeScalar()
  declare readonly [MAP]: CollectionTag;
  declare readonly [SCALAR]: ScalarTag;
  declare readonly [SEQ]: CollectionTag

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
    this.merge = !!merge
    this.name = (typeof schema === 'string' && schema) || 'core'
    this.knownTags = resolveKnownTags ? coreKnownTags : {}
    this.tags = getTags(customTags, this.name)
    this.toStringOptions = toStringDefaults ?? null

    Object.defineProperty(this, MAP, { value: map })
    Object.defineProperty(this, SCALAR, { value: string })
    Object.defineProperty(this, SEQ, { value: seq })

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
