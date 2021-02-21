/* global BigInt */

import { Scalar } from '../ast/Scalar.js'
import { stringifyNumber } from '../stringify/stringifyNumber.js'
import { failsafe } from './failsafe/index.js'
import { boolOptions, intOptions, nullOptions } from './options.js'

const intIdentify = value =>
  typeof value === 'bigint' || Number.isInteger(value)

const intResolve = (src, offset, radix) =>
  intOptions.asBigInt ? BigInt(src) : parseInt(src.substring(offset), radix)

function intStringify(node, radix, prefix) {
  const { value } = node
  if (intIdentify(value) && value >= 0) return prefix + value.toString(radix)
  return stringifyNumber(node)
}

export const nullObj = {
  identify: value => value == null,
  createNode: () => new Scalar(null),
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new Scalar(null),
  options: nullOptions,
  stringify: ({ source }) =>
    source && nullObj.test.test(source) ? source : nullOptions.nullStr
}

export const boolObj = {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: str => new Scalar(str[0] === 't' || str[0] === 'T'),
  options: boolOptions,
  stringify({ source, value }) {
    if (source && boolObj.test.test(source)) {
      const sv = source[0] === 't' || source[0] === 'T'
      if (value === sv) return source
    }
    return value ? boolOptions.trueStr : boolOptions.falseStr
  }
}

export const octObj = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^0o[0-7]+$/,
  resolve: str => intResolve(str, 2, 8),
  options: intOptions,
  stringify: node => intStringify(node, 8, '0o')
}

export const intObj = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9]+$/,
  resolve: str => intResolve(str, 0, 10),
  options: intOptions,
  stringify: stringifyNumber
}

export const hexObj = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^0x[0-9a-fA-F]+$/,
  resolve: str => intResolve(str, 2, 16),
  options: intOptions,
  stringify: node => intStringify(node, 16, '0x')
}

export const nanObj = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.(?:inf|Inf|INF|nan|NaN|NAN))$/,
  resolve: str =>
    str.slice(-3).toLowerCase() === 'nan'
      ? NaN
      : str[0] === '-'
      ? Number.NEGATIVE_INFINITY
      : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
}

export const expObj = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  format: 'EXP',
  test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  resolve: str => parseFloat(str),
  stringify: ({ value }) => Number(value).toExponential()
}

export const floatObj = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str))
    const dot = str.indexOf('.')
    if (dot !== -1 && str[str.length - 1] === '0')
      node.minFractionDigits = str.length - dot - 1
    return node
  },
  stringify: stringifyNumber
}

export const core = failsafe.concat([
  nullObj,
  boolObj,
  octObj,
  intObj,
  hexObj,
  nanObj,
  expObj,
  floatObj
])
