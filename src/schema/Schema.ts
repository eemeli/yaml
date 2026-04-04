import { Pair } from '../nodes/Pair.ts'
import { Scalar } from '../nodes/Scalar.ts'
import type { SchemaOptions, ToStringOptions } from '../options.ts'
import { map } from './common/map.ts'
import { seq } from './common/seq.ts'
import { string } from './common/string.ts'
import { coreKnownTags, getTags } from './tags.ts'
import type { CollectionTag, ScalarTag } from './types.ts'

export class Schema {
  compat: Array<CollectionTag | ScalarTag> | null
  knownTags: Record<string, CollectionTag | ScalarTag>
  mapKey: (value: unknown) => unknown
  name: string
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
    mapKey,
    merge,
    resolveKnownTags,
    schema,
    toStringDefaults
  }: SchemaOptions) {
    this.compat = Array.isArray(compat)
      ? getTags(compat, 'compat')
      : compat
        ? getTags(null, compat)
        : null
    this.mapKey = mapKey ?? defaultMapKey
    this.name = (typeof schema === 'string' && schema) || 'core'
    this.knownTags = resolveKnownTags ? coreKnownTags : {}
    this.tags = getTags(customTags, this.name, merge)
    this.toStringOptions = toStringDefaults ?? null

    Object.defineProperty(this, 'map', { value: map })
    Object.defineProperty(this, 'scalar', { value: string })
    Object.defineProperty(this, 'seq', { value: seq })
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

function defaultMapKey(value: unknown): unknown {
  if (value instanceof Pair) value = value.key
  if (value instanceof Scalar) value = value.value
  return value ?? null
}
