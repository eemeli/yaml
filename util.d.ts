import { Pair, Scalar } from './dist/ast/index'
import { Schema } from './dist/doc/Schema'

export { ToJSContext, toJS } from './dist/ast/toJS'
export { Type } from './dist/constants'
export * from './dist/errors'

export function findPair(items: any[], key: Scalar | any): Pair | undefined

export function stringifyNumber(item: Scalar): string
export function stringifyString(
  item: Scalar,
  ctx: Schema.StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string
