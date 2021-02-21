import { Type } from '../constants.js'
import type { StringifyContext } from '../stringify/stringify.js'
import { Collection } from './Collection.js'
import { Scalar, isScalarValue } from './Scalar.js'
import { toJS, ToJSContext } from './toJS.js'

export declare namespace YAMLSeq {
  interface Parsed extends YAMLSeq {
    items: Node[]
    range: [number, number]
  }
}

export class YAMLSeq<T = unknown> extends Collection {
  static get tagName(): 'tag:yaml.org,2002:seq' {
    return 'tag:yaml.org,2002:seq'
  }

  declare items: T[]

  type?: Type.FLOW_SEQ | Type.SEQ

  add(value: T) {
    this.items.push(value)
  }

  delete(key: number | string | Scalar) {
    const idx = asItemIndex(key)
    if (typeof idx !== 'number') return false
    const del = this.items.splice(idx, 1)
    return del.length > 0
  }

  get(key: number | string | Scalar, keepScalar?: boolean) {
    const idx = asItemIndex(key)
    if (typeof idx !== 'number') return undefined
    const it = this.items[idx]
    return !keepScalar && it instanceof Scalar ? it.value : it
  }

  has(key: number | string | Scalar) {
    const idx = asItemIndex(key)
    return typeof idx === 'number' && idx < this.items.length
  }

  set(key: number | string | Scalar, value: T) {
    const idx = asItemIndex(key)
    if (typeof idx !== 'number')
      throw new Error(`Expected a valid index, not ${key}.`)
    const prev = this.items[idx]
    if (prev instanceof Scalar && isScalarValue(value)) prev.value = value
    else this.items[idx] = value
  }

  toJSON(_?: unknown, ctx?: ToJSContext) {
    const seq: unknown[] = []
    if (ctx && ctx.onCreate) ctx.onCreate(seq)
    let i = 0
    for (const item of this.items) seq.push(toJS(item, String(i++), ctx))
    return seq
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ) {
    if (!ctx) return JSON.stringify(this)
    return super._toString(
      ctx,
      {
        blockItem: n => (n.type === 'comment' ? n.str : `- ${n.str}`),
        flowChars: { start: '[', end: ']' },
        itemIndent: (ctx.indent || '') + '  '
      },
      onComment,
      onChompKeep
    )
  }
}

function asItemIndex(key: unknown): number | null {
  let idx = key instanceof Scalar ? key.value : key
  if (idx && typeof idx === 'string') idx = Number(idx)
  return typeof idx === 'number' && Number.isInteger(idx) && idx >= 0
    ? idx
    : null
}
