import { Alias } from './Alias.ts'
import { Collection } from './Collection.ts'
import type { Node } from './Node.ts'
import { Scalar } from './Scalar.ts'

/** Type predicate for `Node` values */
export const isNode = (node: unknown): node is Node =>
  node instanceof Scalar || node instanceof Alias || node instanceof Collection
