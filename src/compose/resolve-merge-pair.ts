import { Alias } from '../nodes/Alias.js'
import { Merge } from '../nodes/Merge.js'
import { isAlias, isMap, isScalar, ParsedNode } from '../nodes/Node.js'
import type { Pair } from '../nodes/Pair.js'
import type { Scalar } from '../nodes/Scalar.js'

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
