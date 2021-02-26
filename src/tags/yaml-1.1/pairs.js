import { createPair, Pair } from '../../ast/Pair.js'
import { YAMLMap } from '../../ast/YAMLMap.js'
import { YAMLSeq } from '../../ast/YAMLSeq.js'

export function parsePairs(seq, onError) {
  if (seq instanceof YAMLSeq) {
    for (let i = 0; i < seq.items.length; ++i) {
      let item = seq.items[i]
      if (item instanceof Pair) continue
      else if (item instanceof YAMLMap) {
        if (item.items.length > 1)
          onError('Each pair must have its own sequence indicator')
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
  } else onError('Expected a sequence for this tag')
  return seq
}

export function createPairs(schema, iterable, ctx) {
  const { replacer } = ctx
  const pairs = new YAMLSeq(schema)
  pairs.tag = 'tag:yaml.org,2002:pairs'
  let i = 0
  for (let it of iterable) {
    if (typeof replacer === 'function')
      it = replacer.call(iterable, String(i++), it)
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
    pairs.items.push(createPair(key, value, ctx))
  }
  return pairs
}

export const pairs = {
  collection: 'seq',
  default: false,
  tag: 'tag:yaml.org,2002:pairs',
  resolve: parsePairs,
  createNode: createPairs
}
