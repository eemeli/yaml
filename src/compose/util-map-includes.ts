import { isScalar, ParsedNode } from '../nodes/Node'
import { Pair } from '../nodes/Pair'
import { ComposeContext } from './compose-node'

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
