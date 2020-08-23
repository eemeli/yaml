import { schemas, tags } from '../tags/index.js'
import { getSchemaTags } from './getSchemaTags.js'

const sortMapEntriesByKey = (a, b) =>
  a.key < b.key ? -1 : a.key > b.key ? 1 : 0

const coreKnownTags = {
  'tag:yaml.org,2002:binary': tags.binary,
  'tag:yaml.org,2002:omap': tags.omap,
  'tag:yaml.org,2002:pairs': tags.pairs,
  'tag:yaml.org,2002:set': tags.set,
  'tag:yaml.org,2002:timestamp': tags.timestamp
}

export class Schema {
  constructor({ customTags, merge, resolveKnownTags, schema, sortMapEntries }) {
    this.merge = !!merge
    this.name = schema
    this.knownTags = resolveKnownTags ? coreKnownTags : {}
    this.tags = getSchemaTags(schemas, tags, customTags, schema)

    // Used by createNode(), to avoid circular dependencies
    this.map = tags.map
    this.seq = tags.seq

    // Used by createMap()
    this.sortMapEntries =
      sortMapEntries === true ? sortMapEntriesByKey : sortMapEntries || null
  }
}
