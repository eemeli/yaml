import { Scalar } from '../../nodes/Scalar.ts'
import { stringifyNumber } from '../../stringify/stringifyNumber.ts'
import type { ScalarTag } from '../types.ts'

export const floatNaN: ScalarTag = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str: string) =>
    str.slice(-3).toLowerCase() === 'nan'
      ? NaN
      : str[0] === '-'
        ? Number.NEGATIVE_INFINITY
        : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
}

export const floatExp: ScalarTag = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  format: 'EXP',
  test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: (str: string) => parseFloat(str.replace(/_/g, '')),
  stringify(node) {
    const num = Number(node.value)
    return isFinite(num) ? num.toExponential() : stringifyNumber(node)
  }
}

export const float: ScalarTag = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  resolve(str: string) {
    const node = new Scalar(parseFloat(str.replace(/_/g, '')))
    const dot = str.indexOf('.')
    if (dot !== -1) {
      const f = str.substring(dot + 1).replace(/_/g, '')
      if (f[f.length - 1] === '0') node.minFractionDigits = f.length
    }
    return node
  },
  stringify: stringifyNumber
}
