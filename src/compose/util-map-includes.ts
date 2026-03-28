import type { Node } from '../nodes/Node.ts'
import { Scalar } from '../nodes/Scalar.ts'
import type { YAMLMap } from '../nodes/YAMLMap.ts'
import { YAMLSet } from '../nodes/YAMLSet.ts'
import type { ComposeContext } from './compose-node.ts'

const mapKeysEqual = (a: Node, b: Node) =>
  a === b || (a instanceof Scalar && b instanceof Scalar && a.value === b.value)

export function mapIncludes(
  ctx: ComposeContext,
  coll: YAMLMap | YAMLSet,
  search: Node
): boolean {
  if (coll instanceof YAMLSet) {
    return coll.has(search)
  } else {
    const { uniqueKeys } = ctx.options
    if (uniqueKeys === false) return false
    const isEqual = typeof uniqueKeys === 'function' ? uniqueKeys : mapKeysEqual
    return coll.some(pair => isEqual(pair.key, search))
  }
}
