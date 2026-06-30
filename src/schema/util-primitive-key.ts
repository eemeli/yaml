import type { Primitive } from '../nodes/types.ts'
import { Pair } from '../nodes/Pair.ts'
import { Scalar } from '../nodes/Scalar.ts'

export function primitiveKey(value: unknown): Primitive | undefined {
  let value_ = value instanceof Pair ? value.key : value
  value_ = value instanceof Scalar ? value.value : value
  switch (typeof value_) {
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'string':
      return value_
    default:
      return value_ ? undefined : null
  }
}
