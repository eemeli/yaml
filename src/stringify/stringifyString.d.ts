import { Scalar } from '../ast/index'
import { Schema } from '../doc/Schema'

export function stringifyString(
  item: Scalar,
  ctx: Schema.StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string
