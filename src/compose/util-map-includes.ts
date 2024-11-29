import { isScalar } from '../nodes/identity.ts'
import type { ParsedNode } from '../nodes/Node.ts'
import type { Pair } from '../nodes/Pair.ts'
import type { ComposeContext } from './compose-node.ts'

export function mapIncludes(
  ctx: ComposeContext,
  items: Pair<ParsedNode>[],
  search: ParsedNode
) {
  const { uniqueKeys } = ctx.options
  if (uniqueKeys === false) return false
  const isEqual =
    typeof uniqueKeys === 'function'
      ? uniqueKeys
      : (a: ParsedNode, b: ParsedNode) =>
          a === b || (isScalar(a) && isScalar(b) && a.value === b.value)
  return items.some(pair => isEqual(pair.key, search))
}
