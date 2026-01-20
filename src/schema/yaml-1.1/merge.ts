import { isAlias, isMap, isScalar, isSeq } from '../../nodes/identity.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import type { ToJSContext } from '../../nodes/toJS.ts'
import type { MapLike } from '../../nodes/YAMLMap.ts'
import type { ScalarTag } from '../types.ts'

// If the value associated with a merge key is a single mapping node, each of
// its key/value pairs is inserted into the current mapping, unless the key
// already exists in it. If the value associated with the merge key is a
// sequence, then this sequence is expected to contain mapping nodes and each
// of these nodes is merged in turn according to its order in the sequence.
// Keys in mapping nodes earlier in the sequence override keys specified in
// later mapping nodes. -- http://yaml.org/type/merge.html

export const MERGE_KEY = '<<'

export const merge: ScalarTag & {
  identify(value: unknown): boolean
  test: RegExp
} = {
  identify: value =>
    value === MERGE_KEY ||
    (typeof value === 'symbol' && value.description === MERGE_KEY),
  default: 'key',
  tag: 'tag:yaml.org,2002:merge',
  test: new RegExp(`^${MERGE_KEY}$`),
  resolve: () =>
    Object.assign(new Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
  stringify: () => MERGE_KEY
}

export const isMergeKey = (
  ctx: ToJSContext | undefined,
  key: unknown
): boolean =>
  (merge.identify(key) ||
    (isScalar(key) &&
      (!key.type || key.type === Scalar.PLAIN) &&
      merge.identify(key.value))) &&
  Boolean(
    ctx?.doc.schema.tags.some(tag => tag.tag === merge.tag && tag.default)
  )

export function addMergeToJSMap(
  ctx: ToJSContext | undefined,
  map: MapLike,
  value: unknown
): void {
  value = ctx && isAlias(value) ? value.resolve(ctx.doc) : value
  if (isSeq(value)) for (const it of value.items) mergeValue(ctx, map, it)
  else if (Array.isArray(value))
    for (const it of value) mergeValue(ctx, map, it)
  else mergeValue(ctx, map, value)
}

function mergeValue(
  ctx: ToJSContext | undefined,
  map: MapLike,
  value: unknown
) {
  const source = ctx && isAlias(value) ? value.resolve(ctx.doc) : value
  if (!isMap(source))
    throw new Error('Merge sources must be maps or map aliases')
  const srcMap = source.toJSON(null, ctx, Map)
  for (const [key, value] of srcMap) {
    if (map instanceof Map) {
      if (!map.has(key)) map.set(key, value)
    } else if (map instanceof Set) {
      map.add(key)
    } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
      Object.defineProperty(map, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      })
    }
  }
  return map
}
