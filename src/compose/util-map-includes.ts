import type { NodeBase } from '../nodes/Node.ts'
import type { Pair } from '../nodes/Pair.ts'
import { Scalar } from '../nodes/Scalar.ts'
import type { ComposeContext } from './compose-node.ts'

export function mapIncludes(
  ctx: ComposeContext,
  items: Pair[],
  search: NodeBase
): boolean {
  const { uniqueKeys } = ctx.options
  if (uniqueKeys === false) return false
  const isEqual =
    typeof uniqueKeys === 'function'
      ? uniqueKeys
      : (a: NodeBase, b: NodeBase) =>
          a === b ||
          (a instanceof Scalar && b instanceof Scalar && a.value === b.value)
  return items.some(pair => isEqual(pair.key, search))
}
