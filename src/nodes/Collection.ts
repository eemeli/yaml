import type { Schema } from '../schema/Schema.ts'
import type { NodeBase } from './Node.ts'
import type { Scalar } from './Scalar.ts'
import type { YAMLMap } from './YAMLMap.ts'
import type { YAMLSeq } from './YAMLSeq.ts'
import type { YAMLSet } from './YAMLSet.ts'

export type Collection = YAMLMap | YAMLSeq | YAMLSet

export type Primitive = boolean | number | bigint | string | null

export type NodeOf<T> = T extends Primitive ? Scalar<T> : T

export interface CollectionBase extends NodeBase {
  schema: Schema | undefined

  /** An optional anchor on this collection. Used by alias nodes. */
  anchor?: string

  /** If true, stringify this and all child nodes using flow styles. */
  flow?: boolean

  /** The number of items in this collection. */
  readonly size: number
}

export function copyCollection<T extends YAMLMap | YAMLSeq>(
  orig: T,
  schema: Schema | undefined
): T {
  const copy = (orig.constructor as typeof YAMLMap).from(orig, it =>
    it.clone(schema)
  ) as typeof orig
  if (orig.range) copy.range = [...orig.range]
  const propDesc = Object.getOwnPropertyDescriptors(orig)
  for (const [name, prop] of Object.entries(propDesc)) {
    if (!(name in copy)) Object.defineProperty(copy, name, prop)
  }
  if (schema) copy.schema = schema
  return copy
}
