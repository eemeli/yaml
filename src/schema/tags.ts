import { SchemaOptions } from '../options.js'
import { map } from './common/map.js'
import { nullTag } from './common/null.js'
import { seq } from './common/seq.js'
import { string } from './common/string.js'
import { boolTag } from './core/bool.js'
import { float, floatExp, floatNaN } from './core/float.js'
import { int, intHex, intOct } from './core/int.js'
import { schema as core } from './core/schema.js'
import { schema as json } from './json/schema.js'
import { binary } from './yaml-1.1/binary.js'
import { omap } from './yaml-1.1/omap.js'
import { pairs } from './yaml-1.1/pairs.js'
import { schema as yaml11 } from './yaml-1.1/schema.js'
import { set } from './yaml-1.1/set.js'
import { floatTime, intTime, timestamp } from './yaml-1.1/timestamp.js'
import type { CollectionTag, ScalarTag } from './types.js'

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
  'tag:yaml.org,2002:omap': omap,
  'tag:yaml.org,2002:pairs': pairs,
  'tag:yaml.org,2002:set': set,
  'tag:yaml.org,2002:timestamp': timestamp
}

export function getTags(
  customTags: SchemaOptions['customTags'] | undefined,
  schemaName: string
) {
  let tags: Tags | undefined = schemas.get(schemaName)
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

  return tags.map(tag => {
    if (typeof tag !== 'string') return tag
    const tagObj = tagsByName[tag]
    if (tagObj) return tagObj
    const keys = Object.keys(tagsByName)
      .map(key => JSON.stringify(key))
      .join(', ')
    throw new Error(`Unknown custom tag "${tag}"; use one of ${keys}`)
  })
}
