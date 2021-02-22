import { Alias } from '../ast/Alias.js'
import { Merge } from '../ast/Merge.js'
import type { Node } from '../ast/Node.js'
import type { Pair } from '../ast/Pair.js'
import { Scalar } from '../ast/Scalar.js'
import { YAMLMap } from '../ast/YAMLMap.js'

export function resolveMergePair(
  pair: Pair,
  onError: (offset: number, message: string) => void
) {
  if (!(pair.key instanceof Scalar) || pair.key.value !== Merge.KEY) return pair

  const merge = new Merge(pair as Pair<Scalar, Alias>)
  for (const node of merge.value.items as Alias.Parsed[]) {
    if (node instanceof Alias) {
      if (node.source instanceof YAMLMap) {
        // ok
      } else {
        onError(node.range[0], 'Merge nodes aliases can only point to maps')
      }
    } else {
      onError(
        (node as Node.Parsed).range[0],
        'Merge nodes can only have Alias nodes as values'
      )
    }
  }
  return merge
}
