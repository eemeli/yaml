import { Scalar } from '../../nodes/Scalar.js'
import type { StringifyContext } from '../../stringify/stringify.js'
import type { ScalarTag } from '../types.js'

function boolStringify({ value, source }: Scalar, ctx: StringifyContext) {
  const boolObj = value ? trueTag : falseTag
  if (source && boolObj.test.test(source)) return source
  return value ? ctx.options.trueStr : ctx.options.falseStr
}

export const trueTag: ScalarTag & { test: RegExp } = {
  identify: value => value === true,
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => new Scalar(true),
  stringify: boolStringify
}

export const falseTag: ScalarTag & { test: RegExp } = {
  identify: value => value === false,
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,
  resolve: () => new Scalar(false),
  stringify: boolStringify
}
