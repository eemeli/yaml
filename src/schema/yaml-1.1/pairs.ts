import type { NodeCreator } from '../../doc/NodeCreator.ts'
import type { Node } from '../../nodes/Node.ts'
import { Pair } from '../../nodes/Pair.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import { YAMLMap } from '../../nodes/YAMLMap.ts'
import { YAMLSeq } from '../../nodes/YAMLSeq.ts'
import type { CollectionTag } from '../types.ts'

export function resolvePairs(
  seq: YAMLSeq | YAMLMap,
  onError: (message: string) => void
): YAMLSeq<Pair> {
  if (seq instanceof YAMLSeq) {
    for (let i = 0; i < seq.length; ++i) {
      const item = seq[i]
      if (item instanceof Pair) continue
      else if (item instanceof YAMLMap) {
        if (item.length > 1)
          onError('Each pair must have its own sequence indicator')
        const pair = item[0] || new Pair(new Scalar(null))
        if (item.commentBefore)
          pair.key.commentBefore = pair.key.commentBefore
            ? `${item.commentBefore}\n${pair.key.commentBefore}`
            : item.commentBefore
        if (item.comment) {
          const cn = pair.value ?? pair.key
          cn.comment = cn.comment
            ? `${item.comment}\n${cn.comment}`
            : item.comment
        }
        seq[i] = pair
      } else {
        seq[i] = new Pair<Node, null>(item, null)
      }
    }
  } else onError('Expected a sequence for this tag')
  return seq as YAMLSeq<Pair>
}

export function createPairs(nc: NodeCreator, iterable: unknown): YAMLSeq<Pair> {
  const pairs = new YAMLSeq<Pair>(nc.schema)
  pairs.tag = 'tag:yaml.org,2002:pairs'
  let i = 0
  if (iterable && Symbol.iterator in Object(iterable))
    for (let it of iterable as Iterable<unknown>) {
      if (typeof nc.replacer === 'function')
        it = nc.replacer.call(iterable, String(i++), it)
      let key: unknown, value: unknown
      if (Array.isArray(it)) {
        if (it.length === 2) {
          key = it[0]
          value = it[1]
        } else throw new TypeError(`Expected [key, value] tuple: ${it}`)
      } else if (it && it instanceof Object) {
        const keys = Object.keys(it)
        if (keys.length === 1) {
          key = keys[0]
          value = (it as any)[key as string]
        } else {
          throw new TypeError(
            `Expected tuple with one key, not ${keys.length} keys`
          )
        }
      } else {
        key = it
      }
      pairs.push(nc.createPair(key, value))
    }
  return pairs
}

export const pairs: CollectionTag = {
  collection: 'seq',
  default: false,
  tag: 'tag:yaml.org,2002:pairs',
  resolve: resolvePairs,
  createNode: createPairs
}
