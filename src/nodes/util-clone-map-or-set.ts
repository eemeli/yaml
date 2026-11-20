import type { Schema } from '../schema/Schema.ts'
import { Pair } from './Pair.ts'
import type { YAMLMap } from './YAMLMap.ts'
import type { YAMLSet } from './YAMLSet.ts'

export function cloneMapOrSet<T extends YAMLMap | YAMLSet>(
  coll: T,
  schema?: Schema
): T {
  schema ??= coll.schema
  const copy = new (coll.constructor as typeof YAMLMap)(schema) as T
  for (const [key, value] of coll.values) {
    const cloned = value.clone(schema) as any
    copy.values.set(key, cloned)
    copy._indexNode(cloned instanceof Pair ? cloned.key : cloned, key)
  }
  if (coll.range) copy.range = [...coll.range]
  const propDesc = Object.getOwnPropertyDescriptors(coll)
  for (const [name, prop] of Object.entries(propDesc)) {
    if (!(name in copy)) Object.defineProperty(copy, name, prop)
  }
  return copy
}
