export function getSchemaTags(schemas, knownTags, customTags, schemaId) {
  let tags = schemas[schemaId.replace(/\W/g, '')] // 'yaml-1.1' -> 'yaml11'
  if (!tags) {
    const keys = Object.keys(schemas)
      .map(key => JSON.stringify(key))
      .join(', ')
    throw new Error(`Unknown schema "${schemaId}"; use one of ${keys}`)
  }

  if (Array.isArray(customTags)) {
    for (const tag of customTags) tags = tags.concat(tag)
  } else if (typeof customTags === 'function') {
    tags = customTags(tags.slice())
  }

  for (let i = 0; i < tags.length; ++i) {
    const tag = tags[i]
    if (typeof tag === 'string') {
      const tagObj = knownTags[tag]
      if (!tagObj) {
        const keys = Object.keys(knownTags)
          .map(key => JSON.stringify(key))
          .join(', ')
        throw new Error(`Unknown custom tag "${tag}"; use one of ${keys}`)
      }
      tags[i] = tagObj
    }
  }

  return tags
}
