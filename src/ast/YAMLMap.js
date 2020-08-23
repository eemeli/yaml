import { Collection } from './Collection.js'
import { Pair } from './Pair.js'
import { Scalar, isScalarValue } from './Scalar.js'

export function findPair(items, key) {
  const k = key instanceof Scalar ? key.value : key
  for (const it of items) {
    if (it instanceof Pair) {
      if (it.key === key || it.key === k) return it
      if (it.key && it.key.value === k) return it
    }
  }
  return undefined
}

export class YAMLMap extends Collection {
  add(pair, overwrite) {
    if (!pair) pair = new Pair(pair)
    else if (!(pair instanceof Pair))
      pair = new Pair(pair.key || pair, pair.value)
    const prev = findPair(this.items, pair.key)
    const sortEntries = this.schema && this.schema.sortMapEntries
    if (prev) {
      if (!overwrite) throw new Error(`Key ${pair.key} already set`)
      // For scalars, keep the old node & its comments and anchors
      if (prev.value instanceof Scalar && isScalarValue(pair.value))
        prev.value.value = pair.value
      else prev.value = pair.value
    } else if (sortEntries) {
      const i = this.items.findIndex(item => sortEntries(pair, item) < 0)
      if (i === -1) this.items.push(pair)
      else this.items.splice(i, 0, pair)
    } else {
      this.items.push(pair)
    }
  }

  delete(key) {
    const it = findPair(this.items, key)
    if (!it) return false
    const del = this.items.splice(this.items.indexOf(it), 1)
    return del.length > 0
  }

  get(key, keepScalar) {
    const it = findPair(this.items, key)
    const node = it && it.value
    return !keepScalar && node instanceof Scalar ? node.value : node
  }

  has(key) {
    return !!findPair(this.items, key)
  }

  set(key, value) {
    this.add(new Pair(key, value), true)
  }

  /**
   * @param {*} arg ignored
   * @param {*} ctx Conversion context, originally set in Document#toJSON()
   * @param {Class} Type If set, forces the returned collection type
   * @returns {*} Instance of Type, Map, or Object
   */
  toJSON(_, ctx, Type) {
    const map = Type ? new Type() : ctx && ctx.mapAsMap ? new Map() : {}
    if (ctx && ctx.onCreate) ctx.onCreate(map)
    for (const item of this.items) item.addToJSMap(ctx, map)
    return map
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx) return JSON.stringify(this)
    for (const item of this.items) {
      if (!(item instanceof Pair))
        throw new Error(
          `Map items must all be pairs; found ${JSON.stringify(item)} instead`
        )
    }
    return super.toString(
      ctx,
      {
        blockItem: n => n.str,
        flowChars: { start: '{', end: '}' },
        isMap: true,
        itemIndent: ctx.indent || ''
      },
      onComment,
      onChompKeep
    )
  }
}
