import type { Document } from '../doc/Document.js'
import type { stringify } from '../stringify/stringify.js'
import { hasAnchor, Node } from './Node.js'

export interface AnchorData {
  aliasCount: number
  count: number
}

export interface ToJSContext {
  anchors: Map<Node, AnchorData>
  doc: Document
  keep: boolean
  mapAsMap: boolean
  mapKeyWarned: boolean
  maxAliasCount: number
  onCreate?: (res: unknown) => void
  resolved: WeakMap<Node, unknown>

  /** Requiring this directly in Pair would create circular dependencies */
  stringify: typeof stringify
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
    if (ctx) {
      if (hasAnchor(value)) ctx.anchors.set(value, { aliasCount: 0, count: 1 })
      ctx.onCreate = res => {
        ctx.onCreate = undefined
        ctx.resolved.set(value, res)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const res = value.toJSON(arg, ctx)
    if (ctx?.onCreate) ctx.onCreate(res)
    return res
  }
  if (typeof value === 'bigint' && !ctx?.keep) return Number(value)
  return value
}
