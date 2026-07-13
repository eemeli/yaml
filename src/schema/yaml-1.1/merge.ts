import type { Document, DocValue } from '../../doc/Document.ts'
import { Alias, getAliasCount } from '../../nodes/Alias.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import type { ToJSContext } from '../../nodes/toJS.ts'
import type { MapLike, YAMLMap } from '../../nodes/YAMLMap.ts'
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
  test: RegExp
} = {
  identify: value =>
    value === MERGE_KEY ||
    (typeof value === 'symbol' && value.description === MERGE_KEY),
  default: 'key',
  tag: 'tag:yaml.org,2002:merge',
  test: /^<<$/,
  resolve: () =>
    Object.assign(new Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
  stringify: () => MERGE_KEY
}

export const isMergeKey = (
  doc: Document<DocValue, boolean>,
  key: unknown
): boolean =>
  (merge.identify(key) ||
    (key instanceof Scalar &&
      (!key.type || key.type === Scalar.PLAIN) &&
      merge.identify(key.value))) &&
  Boolean(doc.schema.tags.some(tag => tag.tag === merge.tag && tag.default))

export function addMergeToJSMap(
  doc: Document<DocValue, boolean>,
  ctx: ToJSContext,
  map: MapLike,
  value: unknown
): void {
  const source = getMergeSource(doc, ctx, value)
  if (Array.isArray(source)) {
    for (const it of source) mergeValue(doc, ctx, map, it)
  } else {
    mergeValue(doc, ctx, map, value)
  }
}

function mergeValue(
  doc: Document<DocValue, boolean>,
  ctx: ToJSContext,
  map: MapLike,
  value: unknown
) {
  const source = getMergeSource(doc, ctx, value)
  const srcMap = (source as YAMLMap).toJS(doc, ctx, Map<any, any>)
  if (!(srcMap instanceof Map))
    throw new Error('Merge sources must be maps or map aliases')
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

function getMergeSource(
  doc: Document<DocValue, boolean>,
  ctx: ToJSContext,
  value: unknown
) {
  if (!(value instanceof Alias)) return value

  const source = value.resolve(doc, ctx)
  if (!source) {
    const msg = `Unresolved alias (the anchor must be set before the alias): ${value.source}`
    throw new ReferenceError(msg)
  }

  ctx.resolveAlias(
    doc,
    source,
    () => getAliasCount(doc, ctx, source, ctx.anchors)
  )
  return source
}
