export type Reviver = (
  this: any,
  key: unknown,
  value: unknown,
  context: { source?: string }
) => unknown

/**
 * Applies the JSON.parse reviver algorithm as defined in the ECMA-262 spec,
 * in section 24.5.1.1 "Runtime Semantics: InternalizeJSONProperty" of the
 * 2026 edition: https://tc39.es/ecma262/#sec-json.parse
 *
 * Includes extensions for handling Map and Set objects.
 */
export function applyReviver(
  reviver: Reviver,
  sources: WeakMap<any, Map<unknown, string>>,
  obj: unknown,
  key: unknown,
  val: any
): unknown {
  const ctx: ReviverContext = { reviver, seen: new Set(), sources }
  return applyReviver_(ctx, obj, key, val)
}

interface ReviverContext {
  reviver: Reviver
  seen: Set<unknown>
  sources: WeakMap<any, Map<unknown, string>>
}

function applyReviver_(
  ctx: ReviverContext,
  obj: unknown,
  key: unknown,
  val: any
): unknown {
  if (val && typeof val === 'object') {
    if (ctx.seen.has(val)) return val
    ctx.seen.add(val)
    if (Array.isArray(val)) {
      for (let i = 0, len = val.length; i < len; ++i) {
        const v0 = val[i]
        const v1 = applyReviver_(ctx, val, String(i), v0)
        // eslint-disable-next-line @typescript-eslint/no-array-delete
        if (v1 === undefined) delete val[i]
        else if (v1 !== v0) val[i] = v1
      }
    } else if (val instanceof Map) {
      for (const k of Array.from(val.keys())) {
        const v0 = val.get(k)
        const v1 = applyReviver_(ctx, val, k, v0)
        if (v1 === undefined) val.delete(k)
        else if (v1 !== v0) val.set(k, v1)
      }
    } else if (val instanceof Set) {
      for (const v0 of Array.from(val)) {
        const v1 = applyReviver_(ctx, val, v0, v0)
        if (v1 === undefined) val.delete(v0)
        else if (v1 !== v0) {
          val.delete(v0)
          val.add(v1)
        }
      }
    } else {
      for (const [k, v0] of Object.entries(val)) {
        const v1 = applyReviver_(ctx, val, k, v0)
        if (v1 === undefined) delete val[k]
        else if (v1 !== v0) val[k] = v1
      }
    }
  }
  const context = Object.create(null)
  const source = ctx.sources.get(obj)?.get(key)
  if (source !== undefined) context.source = source
  return ctx.reviver.call(obj, key, val, context)
}
