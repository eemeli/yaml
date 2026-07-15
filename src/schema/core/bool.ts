import { Scalar } from '../../nodes/Scalar.ts'
import type { ScalarTag } from '../types.ts'

const boolValues = new Set(['true', 'True', 'TRUE', 'false', 'False', 'FALSE'])

export const boolTag: ScalarTag & { test: (value: string) => boolean } = {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: (value: string) => boolValues.has(value),
  resolve: str => new Scalar(str[0] === 't' || str[0] === 'T'),
  stringify({ source, value }, ctx) {
    if (source && boolTag.test(source)) {
      const sv = source[0] === 't' || source[0] === 'T'
      if (value === sv) return source
    }
    return value ? ctx.options.trueStr : ctx.options.falseStr
  }
}
