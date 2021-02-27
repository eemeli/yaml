import { Alias } from '../ast/Alias.js'
import type { ParsedNode } from '../ast/index.js'
import { Merge } from '../ast/Merge.js'
import { isAlias, isMap, isScalar } from '../ast/Node.js'
import type { Pair } from '../ast/Pair.js'
import type { Scalar } from '../ast/Scalar.js'

export function resolveMergePair(
  pair: Pair,
  onError: (offset: number, message: string) => void
) {
  if (!isScalar(pair.key) || pair.key.value !== Merge.KEY) return pair

  const merge = new Merge(pair as Pair<Scalar, Alias>)
  for (const node of merge.value.items as Alias.Parsed[]) {
    if (isAlias(node)) {
      if (isMap(node.source)) {
        // ok
      } else {
        onError(node.range[0], 'Merge nodes aliases can only point to maps')
      }
    } else {
      onError(
        (node as ParsedNode).range[0],
        'Merge nodes can only have Alias nodes as values'
      )
    }
  }
  return merge
}
