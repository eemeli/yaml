import { isScalar } from '../nodes/identity.js'
import type { ParsedNode } from '../nodes/Node.js'
import type { Pair } from '../nodes/Pair.js'
import type { ComposeContext } from './compose-node.js'

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
          a === b ||
          (isScalar(a) &&
            isScalar(b) &&
            a.value === b.value &&
            !(a.value === '<<' && ctx.schema.merge))
  return items.some(pair => isEqual(pair.key, search))
}
