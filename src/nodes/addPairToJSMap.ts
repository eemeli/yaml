import type { Document, DocValue } from '../doc/Document.ts'
import { warn } from '../log.ts'
import { createStringifyContext } from '../stringify/stringify.ts'
import type { Pair } from './Pair.ts'
import type { ToJSContext } from './toJS.ts'
import type { Node } from './types.ts'
import type { MapLike } from './YAMLMap.ts'

export function addPairToJSMap(
  doc: Document<DocValue>,
  ctx: ToJSContext,
  map: MapLike,
  { key, value }: Pair
): void {
  if ('addToJSMap' in key && typeof key.addToJSMap === 'function') {
    key.addToJSMap(doc, ctx, map, value)
  } else {
    const jsKey = key.toJS(doc, ctx)
    const jsValue = value ? value.toJS(doc, ctx) : value
    if (map instanceof Map) {
      map.set(jsKey, jsValue)
      ctx.setSource(map, jsKey, value)
    } else {
      const stringKey = stringifyKey(doc, ctx, key, jsKey)
      if (
        (map.constructor !== Object && stringKey in map) ||
        stringKey === '__proto__' ||
        stringKey === 'constructor'
      )
        Object.defineProperty(map, stringKey, {
          value: jsValue,
          writable: true,
          enumerable: true,
          configurable: true
        })
      else map[stringKey] = jsValue
      ctx.setSource(map, stringKey, value)
    }
  }
}

function stringifyKey(
  doc: Document<DocValue>,
  ctx: ToJSContext,
  key: Node,
  jsKey: unknown
) {
  if (jsKey === null) return ''
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  if (typeof jsKey !== 'object') return String(jsKey)
  const strCtx = createStringifyContext(doc, undefined)
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
