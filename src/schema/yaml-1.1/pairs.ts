import type { CreateNodeContext } from '../../doc/createNode.ts'
import { isMap, isPair, isSeq } from '../../nodes/identity.ts'
import type { ParsedNode } from '../../nodes/Node.ts'
import { createPair, Pair } from '../../nodes/Pair.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import type { YAMLMap } from '../../nodes/YAMLMap.ts'
import { YAMLSeq } from '../../nodes/YAMLSeq.ts'
import type { Schema } from '../../schema/Schema.ts'
import type { CollectionTag } from '../types.ts'

export function resolvePairs(
  seq:
    | YAMLSeq.Parsed<ParsedNode | Pair<ParsedNode, ParsedNode | null>>
    | YAMLMap.Parsed,
  onError: (message: string) => void
) {
  if (isSeq(seq)) {
    for (let i = 0; i < seq.items.length; ++i) {
      let item = seq.items[i]
      if (isPair(item)) continue
      else if (isMap(item)) {
        if (item.items.length > 1)
          onError('Each pair must have its own sequence indicator')
        const pair =
          item.items[0] || new Pair(new Scalar(null) as Scalar.Parsed)
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
        item = pair
      }
      seq.items[i] = isPair(item) ? item : new Pair(item)
    }
  } else onError('Expected a sequence for this tag')
  return seq as YAMLSeq.Parsed<Pair<ParsedNode, ParsedNode | null>>
}

export function createPairs(
  schema: Schema,
  iterable: unknown,
  ctx: CreateNodeContext
): YAMLSeq {
  const { replacer } = ctx
  const pairs = new YAMLSeq(schema)
  pairs.tag = 'tag:yaml.org,2002:pairs'
  let i = 0
  if (iterable && Symbol.iterator in Object(iterable))
    for (let it of iterable as Iterable<unknown>) {
      if (typeof replacer === 'function')
        it = replacer.call(iterable, String(i++), it)
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
      pairs.items.push(createPair(key, value, ctx))
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
