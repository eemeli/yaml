import { YAMLSemanticError } from '../../errors'
import { Pair } from '../../ast/Pair'
import { YAMLMap } from '../../ast/YAMLMap'
import { YAMLSeq } from '../../ast/YAMLSeq'
import { resolveSeq } from '../../resolve/resolveSeq'

export function parsePairs(doc, cst) {
  const seq = resolveSeq(doc, cst)
  for (let i = 0; i < seq.items.length; ++i) {
    let item = seq.items[i]
    if (item instanceof Pair) continue
    else if (item instanceof YAMLMap) {
      if (item.items.length > 1) {
        const msg = 'Each pair must have its own sequence indicator'
        throw new YAMLSemanticError(cst, msg)
      }
      const pair = item.items[0] || new Pair()
      if (item.commentBefore)
        pair.commentBefore = pair.commentBefore
          ? `${item.commentBefore}\n${pair.commentBefore}`
          : item.commentBefore
      if (item.comment)
        pair.comment = pair.comment
          ? `${item.comment}\n${pair.comment}`
          : item.comment
      item = pair
    }
    seq.items[i] = item instanceof Pair ? item : new Pair(item)
  }
  return seq
}

export function createPairs(schema, iterable, ctx) {
  const pairs = new YAMLSeq(schema)
  pairs.tag = 'tag:yaml.org,2002:pairs'
  for (const it of iterable) {
    let key, value
    if (Array.isArray(it)) {
      if (it.length === 2) {
        key = it[0]
        value = it[1]
      } else throw new TypeError(`Expected [key, value] tuple: ${it}`)
    } else if (it && it instanceof Object) {
      const keys = Object.keys(it)
      if (keys.length === 1) {
        key = keys[0]
        value = it[key]
      } else throw new TypeError(`Expected { key: value } tuple: ${it}`)
    } else {
      key = it
    }
    const pair = schema.createPair(key, value, ctx)
    pairs.items.push(pair)
  }
  return pairs
}

export const pairs = {
  default: false,
  tag: 'tag:yaml.org,2002:pairs',
  resolve: parsePairs,
  createNode: createPairs
}
