import type { SchemaOptions } from '../options.ts'
import { map } from './common/map.ts'
import { nullTag } from './common/null.ts'
import { seq } from './common/seq.ts'
import { string } from './common/string.ts'
import { boolTag } from './core/bool.ts'
import { float, floatExp, floatNaN } from './core/float.ts'
import { int, intHex, intOct } from './core/int.ts'
import { schema as core } from './core/schema.ts'
import { schema as json } from './json/schema.ts'
import type { CollectionTag, ScalarTag } from './types.ts'
import { binary } from './yaml-1.1/binary.ts'
import { merge } from './yaml-1.1/merge.ts'
import { omap } from './yaml-1.1/omap.ts'
import { pairs } from './yaml-1.1/pairs.ts'
import { schema as yaml11 } from './yaml-1.1/schema.ts'
import { set } from './yaml-1.1/set.ts'
import { floatTime, intTime, timestamp } from './yaml-1.1/timestamp.ts'

const schemas = new Map<string, Array<CollectionTag | ScalarTag>>([
  ['core', core],
  ['failsafe', [map, seq, string]],
  ['json', json],
  ['yaml11', yaml11],
  ['yaml-1.1', yaml11]
])

const tagsByName = {
  binary,
  bool: boolTag,
  float,
  floatExp,
  floatNaN,
  floatTime,
  int,
  intHex,
  intOct,
  intTime,
  map,
  merge,
  null: nullTag,
  omap,
  pairs,
  seq,
  set,
  timestamp
}

export type TagId = keyof typeof tagsByName

export type Tags = Array<ScalarTag | CollectionTag | TagId>

export const coreKnownTags = {
  'tag:yaml.org,2002:binary': binary,
  'tag:yaml.org,2002:merge': merge,
  'tag:yaml.org,2002:omap': omap,
  'tag:yaml.org,2002:pairs': pairs,
  'tag:yaml.org,2002:set': set,
  'tag:yaml.org,2002:timestamp': timestamp
}

export function getTags(
  customTags: SchemaOptions['customTags'] | undefined,
  schemaName: string,
  addMergeTag?: boolean
): (ScalarTag | CollectionTag)[] {
  const schemaTags = schemas.get(schemaName)
  if (schemaTags && !customTags) {
    return addMergeTag && !schemaTags.includes(merge)
      ? schemaTags.concat(merge)
      : schemaTags.slice()
  }

  let tags: Tags | undefined = schemaTags
  if (!tags) {
    if (Array.isArray(customTags)) tags = []
    else {
      const keys = Array.from(schemas.keys())
        .filter(key => key !== 'yaml11')
        .map(key => JSON.stringify(key))
        .join(', ')
      throw new Error(
        `Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`
      )
    }
  }

  if (Array.isArray(customTags)) {
    for (const tag of customTags) tags = tags.concat(tag)
  } else if (typeof customTags === 'function') {
    tags = customTags(tags.slice())
  }
  if (addMergeTag) tags = tags.concat(merge)

  return tags.reduce<(CollectionTag | ScalarTag)[]>((tags, tag) => {
    const tagObj = typeof tag === 'string' ? tagsByName[tag] : tag
    if (!tagObj) {
      const tagName = JSON.stringify(tag)
      const keys = Object.keys(tagsByName)
        .map(key => JSON.stringify(key))
        .join(', ')
      throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`)
    }
    if (!tags.includes(tagObj)) tags.push(tagObj)
    return tags
  }, [])
}
