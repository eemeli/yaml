import type { Document, DocValue } from '../../doc/Document.ts'
import { Alias } from '../../nodes/Alias.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import type { ToJSContext } from '../../nodes/toJS.ts'
import { type MapLike, YAMLMap } from '../../nodes/YAMLMap.ts'
import type { ScalarTag } from '../types.ts'

// If the value associated with a merge key is a single mapping node, each of
// its key/value pairs is inserted into the current mapping, unless the key
// already exists in it. If the value associated with the merge key is a
// sequence, then this sequence is expected to contain mapping nodes and each
// of these nodes is merged in turn according to its order in the sequence.
// Keys in mapping nodes earlier in the sequence override keys specified in
// later mapping nodes. -- http://yaml.org/type/merge.html

const MERGE_KEY = '<<'

export const merge: ScalarTag & {
  identify(value: unknown): boolean
  resolve(): MergeKey
  test: (value: string) => boolean
} = {
  identify: value =>
    typeof value === 'symbol' && value.description === MERGE_KEY,
  default: 'key',
  tag: 'tag:yaml.org,2002:merge',
  test: str => str === MERGE_KEY,
  resolve: () => new MergeKey(),
  stringify: () => MERGE_KEY
}

/**
 * A YAML 1.1 `!!merge` key
 *
 * Using a unique symbol as the value allows for
 * multiple instances in a map.
 */
export class MergeKey extends Scalar<symbol> {
  constructor() {
    super(Symbol(MERGE_KEY))
    this.addToJSMap = addToJSMap
  }
}

function addToJSMap(
  doc: Document<DocValue>,
  ctx: ToJSContext,
  map: MapLike,
  value: unknown,
  isPlainObject: boolean
): void {
  const source = getMergeSource(doc, ctx, value)
  if (Array.isArray(source)) {
    for (const v of source) {
      const s = getMergeSource(doc, ctx, v)
      mergeValue(doc, ctx, map, s, isPlainObject)
    }
  } else {
    mergeValue(doc, ctx, map, source, isPlainObject)
  }
}

function mergeValue(
  doc: Document<DocValue>,
  ctx: ToJSContext,
  map: MapLike,
  source: unknown,
  isPlainObject: boolean
) {
  if (!(source instanceof YAMLMap))
    throw new Error('Merge sources must be maps or map aliases')
  const srcMap = source.toJS(doc, ctx)
  const srcIter = srcMap instanceof Map ? srcMap : Object.entries(srcMap)
  for (const [key, value] of srcIter) {
    if (map instanceof Map) {
      if (!map.has(key)) map.set(key, value)
    } else if (map instanceof Set) {
      map.add(key)
    } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
      if (!isPlainObject || key === '__proto__' || key === 'constructor') {
        Object.defineProperty(map, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        })
      } else {
        map[key] = value
      }
    }
  }
  return map
}

function getMergeSource(
  doc: Document<DocValue>,
  ctx: ToJSContext,
  value: unknown
) {
  if (!(value instanceof Alias)) return value

  const source = value.resolve(doc, ctx)
  if (!source) {
    const msg = `Unresolved alias (the anchor must be set before the alias): ${value.source}`
    throw new ReferenceError(msg)
  }

  ctx.resolveAlias(doc, source)
  return source
}
