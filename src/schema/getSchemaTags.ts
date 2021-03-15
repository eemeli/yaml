import type { SchemaId, TagId, TagObj, TagValue } from './types.js'
import type { SchemaName } from './Schema.js'

export function getSchemaTags(
  schemas: Record<SchemaId, TagObj[]>,
  knownTags: Record<TagId, TagObj>,
  customTags:
    | TagValue[]
    | ((tags: TagValue[]) => TagValue[])
    | null
    | undefined,
  schemaName: SchemaName
) {
  const schemaId = schemaName.replace(/\W/g, '') as SchemaId // 'yaml-1.1' -> 'yaml11'
  let tags: TagValue[] = schemas[schemaId]
  if (!tags) {
    const keys = Object.keys(schemas)
      .map(key => JSON.stringify(key))
      .join(', ')
    throw new Error(`Unknown schema "${schemaName}"; use one of ${keys}`)
  }

  if (Array.isArray(customTags)) {
    for (const tag of customTags) tags = tags.concat(tag)
  } else if (typeof customTags === 'function') {
    tags = customTags(tags.slice())
  }

  return tags.map(tag => {
    if (typeof tag !== 'string') return tag
    const tagObj = knownTags[tag]
    if (tagObj) return tagObj
    const keys = Object.keys(knownTags)
      .map(key => JSON.stringify(key))
      .join(', ')
    throw new Error(`Unknown custom tag "${tag}"; use one of ${keys}`)
  })
}
