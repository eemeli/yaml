import type { Document } from '../doc/Document.js'
import { hasAnchor } from './identity.js'
import type { Node } from './Node.js'

export interface AnchorData {
  aliasCount: number
  count: number
  res: unknown
}

export interface ToJSContext {
  anchors: Map<Node, AnchorData>
  doc: Document<Node, boolean>
  keep: boolean
  mapAsMap: boolean
  mapKeyWarned: boolean
  maxAliasCount: number
  onCreate?: (res: unknown) => void
}

/**
 * Recursively convert any node or its contents to native JavaScript
 *
 * @param value - The input value
 * @param arg - If `value` defines a `toJSON()` method, use this
 *   as its first argument
 * @param ctx - Conversion context, originally set in Document#toJS(). If
 *   `{ keep: true }` is not set, output should be suitable for JSON
 *   stringification.
 */
export function toJS(value: any, arg: string | null, ctx?: ToJSContext): any {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  if (Array.isArray(value)) return value.map((v, i) => toJS(v, String(i), ctx))
  if (value && typeof value.toJSON === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (!ctx || !hasAnchor(value)) return value.toJSON(arg, ctx)
    const data: AnchorData = { aliasCount: 0, count: 1, res: undefined }
    ctx.anchors.set(value, data)
    ctx.onCreate = res => {
      data.res = res
      delete ctx.onCreate
    }
    const res = value.toJSON(arg, ctx)
    if (ctx.onCreate) ctx.onCreate(res)
    return res
  }
  if (typeof value === 'bigint' && !ctx?.keep) return Number(value)
  return value
}
