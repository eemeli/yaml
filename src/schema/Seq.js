// Published as 'yaml/seq'

import toJSON from '../toJSON'
import Collection from './Collection'
import Scalar from './Scalar'

export default class YAMLSeq extends Collection {
  get(key, keepScalar) {
    const k = key instanceof Scalar ? key.value : key
    if (!isFinite(k)) return undefined
    const it = this.items[k]
    return !keepScalar && it instanceof Scalar ? it.value : it
  }

  set(key, value) {
    const k = typeof key === 'number' ? key : Number(key)
    if (k < 0 || !Number.isInteger(k))
      throw new Error(`Expected a valid index for YAML sequence, not ${key}.`)
    this.items[k] = value
  }

  toJSON(_, opt) {
    return this.items.map((v, i) => toJSON(v, String(i), opt))
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
