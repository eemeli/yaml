/* global BigInt */

import { Scalar } from '../schema/Scalar'
import { stringifyNumber } from '../stringify'
import { failsafe } from './failsafe'
import { boolOptions, intOptions, nullOptions } from './options'

const intIdentify = value =>
  typeof value === 'bigint' || Number.isInteger(value)

const intResolve = (src, part, radix) =>
  intOptions.asBigInt ? BigInt(src) : parseInt(part, radix)

function intStringify(node, radix, prefix) {
  const { value } = node
  if (intIdentify(value) && value >= 0) return prefix + value.toString(radix)
  return stringifyNumber(node)
}

export const nullObj = {
  identify: value => value == null,
  createNode: (schema, value, ctx) =>
    ctx.wrapScalars ? new Scalar(null) : null,
  default: true,
  tag: 'tag:yaml.org,2002:null',
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => null,
  options: nullOptions,
  stringify: () => nullOptions.nullStr
}

export const boolObj = {
  identify: value => typeof value === 'boolean',
  default: true,
  tag: 'tag:yaml.org,2002:bool',
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: str => str[0] === 't' || str[0] === 'T',
  options: boolOptions,
  stringify: ({ value }) => (value ? boolOptions.trueStr : boolOptions.falseStr)
}

export const octObj = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^0o([0-7]+)$/,
  resolve: (str, oct) => intResolve(str, oct, 8),
  options: intOptions,
  stringify: node => intStringify(node, 8, '0o')
}

export const intObj = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9]+$/,
  resolve: str => intResolve(str, str, 10),
  options: intOptions,
  stringify: stringifyNumber
}

export const hexObj = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^0x([0-9a-fA-F]+)$/,
  resolve: (str, hex) => intResolve(str, hex, 16),
  options: intOptions,
  stringify: node => intStringify(node, 16, '0x')
}

export const nanObj = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  test: /^(?:[-+]?\.inf|(\.nan))$/i,
  resolve: (str, nan) =>
    nan
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
  test: /^[-+]?(?:\.([0-9]+)|[0-9]+\.([0-9]*))$/,
  resolve(str, frac1, frac2) {
    const frac = frac1 || frac2
    const node = new Scalar(parseFloat(str))
    if (frac && frac[frac.length - 1] === '0')
      node.minFractionDigits = frac.length
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
