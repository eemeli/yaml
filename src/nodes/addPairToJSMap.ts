import type { Document, DocValue } from '../doc/Document.ts'
import { warn } from '../log.ts'
import { addMergeToJSMap, isMergeKey } from '../schema/yaml-1.1/merge.ts'
import { createStringifyContext } from '../stringify/stringify.ts'
import type { Node } from './Node.ts'
import type { Pair } from './Pair.ts'
import type { ToJSContext } from './toJS.ts'
import type { MapLike } from './YAMLMap.ts'

export function addPairToJSMap(
  doc: Document<DocValue, boolean>,
  ctx: ToJSContext,
  map: MapLike,
  { key, value }: Pair
): MapLike {
  if ('addToJSMap' in key) key.addToJSMap?.(doc, ctx, map, value)
  // TODO: Should drop this special case for bare << handling
  else if (isMergeKey(doc, key)) addMergeToJSMap(doc, ctx, map, value)
  else {
    const jsKey = key.toJS(doc, ctx)
    if (map instanceof Map) {
      map.set(jsKey, value ? value.toJS(doc, ctx) : value)
    } else if (map instanceof Set) {
      map.add(jsKey)
    } else {
      const stringKey = stringifyKey(doc, ctx, key, jsKey)
      const jsValue = value ? value.toJS(doc, ctx) : value
      if (stringKey in map)
        Object.defineProperty(map, stringKey, {
          value: jsValue,
          writable: true,
          enumerable: true,
          configurable: true
        })
      else map[stringKey] = jsValue
    }
  }
  return map
}

function stringifyKey(
  doc: Document<DocValue, boolean>,
  ctx: ToJSContext,
  key: Node,
  jsKey: unknown
) {
  if (jsKey === null) return ''
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  if (typeof jsKey !== 'object') return String(jsKey)
  const strCtx = createStringifyContext(doc, {})
  strCtx.anchors = new Set()
  for (const node of ctx.anchors.keys())
    strCtx.anchors.add(node.anchor as 'string')
  strCtx.inFlow = true
  strCtx.inStringifyKey = true
  const strKey = key.toString(strCtx)
  if (!ctx.mapKeyWarned) {
    let jsonStr = JSON.stringify(strKey)
    if (jsonStr.length > 40) jsonStr = jsonStr.substring(0, 36) + '..."'
    const msg = `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use a Map instead.`
    warn(doc.options.logLevel, msg)
    ctx.mapKeyWarned = true
  }
  return strKey
}
