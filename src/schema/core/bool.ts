import { Scalar } from '../../nodes/Scalar.js'
import type { ScalarTag } from '../types.js'

export const boolTag: ScalarTag & { test: RegExp } = {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: str => new Scalar(str[0] === 't' || str[0] === 'T'),
  stringify({ source, value }, ctx) {
    if (source && boolTag.test.test(source)) {
      const sv = source[0] === 't' || source[0] === 'T'
      if (value === sv) return source
    }
    return value ? ctx.options.trueStr : ctx.options.falseStr
  }
}
