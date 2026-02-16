import { Alias } from './Alias.ts'
import type { Node } from './Node.ts'
import { Scalar } from './Scalar.ts'
import { YAMLMap } from './YAMLMap.ts'
import { YAMLSeq } from './YAMLSeq.ts'

/** Type predicate for collections */
export const isCollection = (node: unknown): node is YAMLMap | YAMLSeq =>
  node instanceof YAMLMap || node instanceof YAMLSeq

/** Type predicate for `Node` values */
export const isNode = (node: unknown): node is Node =>
  node instanceof Scalar ||
  node instanceof Alias ||
  node instanceof YAMLMap ||
  node instanceof YAMLSeq
