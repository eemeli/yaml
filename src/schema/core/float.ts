import { Scalar } from '../../nodes/Scalar.ts'
import { stringifyNumber } from '../../stringify/stringifyNumber.ts'
import type { ScalarTag } from '../types.ts'

const floatNaNValues = new Set([
  '.nan',
  '.NaN',
  '.NAN',
  '.inf',
  '.Inf',
  '.INF',
  '+.inf',
  '+.Inf',
  '+.INF',
  '-.inf',
  '-.Inf',
  '-.INF'
])

/** First char must be a digit, sign, or dot to match any float pattern */
function couldBeFloat(value: string) {
  const c = value.charCodeAt(0)
  return (
    (c >= 0x30 && c <= 0x39) || // 0-9
    c === 0x2b || // +
    c === 0x2d || // -
    c === 0x2e // .
  )
}

const floatExpRe = /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/
const floatRe = /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/

export const floatNaN: ScalarTag & { test: (value: string) => boolean } = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: (value: string) => floatNaNValues.has(value),
  resolve: str =>
    str.slice(-3).toLowerCase() === 'nan'
      ? NaN
      : str[0] === '-'
        ? Number.NEGATIVE_INFINITY
        : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
}

export const floatExp: ScalarTag & { test: (value: string) => boolean } = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  format: 'EXP',
  test: (value: string) => couldBeFloat(value) && floatExpRe.test(value),
  resolve: str => parseFloat(str),
  stringify(node) {
    const num = Number(node.value)
    return isFinite(num) ? num.toExponential() : stringifyNumber(node)
  }
}

export const float: ScalarTag & { test: (value: string) => boolean } = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: (value: string) => couldBeFloat(value) && floatRe.test(value),
  resolve(str) {
    const node = new Scalar(parseFloat(str))
    const dot = str.indexOf('.')
    if (dot !== -1 && str[str.length - 1] === '0')
      node.minFractionDigits = str.length - dot - 1
    return node
  },
  stringify: stringifyNumber
}
