import { Scalar } from '../../nodes/Scalar.ts'
import type { ScalarTag } from '../types.ts'

const nullValues = new Set(['', '~', 'null', 'Null', 'NULL'])
const isNull = (value: string) => nullValues.has(value)

export const nullTag: ScalarTag & { test: (value: string) => boolean } = {
  identify: value => value == null,
  createNode: () => new Scalar(null),
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: isNull,
  resolve: () => new Scalar(null),
  stringify: ({ source }, ctx) =>
    typeof source === 'string' && nullTag.test(source)
      ? source
      : ctx.options.nullStr
}
