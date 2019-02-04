// Published as 'yaml/seq'

import toJSON from '../toJSON'
import Collection from './Collection'
import Scalar from './Scalar'

function asItemIndex(key) {
  let idx = key instanceof Scalar ? key.value : key
  if (idx && typeof idx === 'string') idx = Number(idx)
  return Number.isInteger(idx) && idx >= 0 ? idx : null
}

export default class YAMLSeq extends Collection {
  add(value) {
    this.items.push(value)
  }

  delete(key) {
    const idx = asItemIndex(key)
    if (typeof idx !== 'number') return false
    const del = this.items.splice(idx, 1)
    return del.length > 0
  }

  get(key, keepScalar) {
    const idx = asItemIndex(key)
    if (typeof idx !== 'number') return undefined
    const it = this.items[idx]
    return !keepScalar && it instanceof Scalar ? it.value : it
  }

  has(key) {
    const idx = asItemIndex(key)
    return typeof idx === 'number' && idx < this.items.length
  }

  set(key, value) {
    const idx = asItemIndex(key)
    if (typeof idx !== 'number')
      throw new Error(`Expected a valid index, not ${key}.`)
    this.items[idx] = value
  }

  toJSON(_, ctx) {
    const seq = []
    if (ctx && ctx.onCreate) ctx.onCreate(seq)
    let i = 0
    for (const item of this.items) seq.push(toJSON(item, String(i++), ctx))
    return seq
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx) return JSON.stringify(this)
    return super.toString(
      ctx,
      {
        blockItem: n => (n.type === 'comment' ? n.str : `- ${n.str}`),
        flowChars: { start: '[', end: ']' },
        isMap: false,
        itemIndent: (ctx.indent || '') + '  '
      },
      onComment,
      onChompKeep
    )
  }
}
