import type { Pair } from '../nodes/Pair.js'
import type { SchemaOptions } from '../options.js'
import { schemas, tags } from '../tags/index.js'
import type { CollectionTag, ScalarTag } from '../tags/types.js'
import { getSchemaTags } from './getSchemaTags.js'

export type SchemaName = 'core' | 'failsafe' | 'json' | 'yaml-1.1'

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
  knownTags: Record<string, CollectionTag | ScalarTag>
  merge: boolean
  name: SchemaName
  sortMapEntries: ((a: Pair, b: Pair) => number) | null
  tags: Array<CollectionTag | ScalarTag>

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
