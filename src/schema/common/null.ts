import { Scalar } from '../../nodes/Scalar.ts'
import type { ScalarTag } from '../types.ts'

export const nullTag: ScalarTag & { test: RegExp } = {
  identify: value => value == null,
  createNode: () => new Scalar(null),
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new Scalar(null),
  stringify: ({ source }, ctx) =>
    typeof source === 'string' && nullTag.test.test(source)
      ? source
      : ctx.options.nullStr
}
