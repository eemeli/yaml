/* global BigInt */

import { Scalar } from '../../schema/Scalar'
import { stringifyNumber } from '../../stringify'
import { failsafe } from '../failsafe'
import { boolOptions, intOptions, nullOptions } from '../options'
import { binary } from './binary'
import { omap } from './omap'
import { pairs } from './pairs'
import { set } from './set'
import { intTime, floatTime, timestamp } from './timestamp'

const boolStringify = ({ value }) =>
  value ? boolOptions.trueStr : boolOptions.falseStr

const intIdentify = value =>
  typeof value === 'bigint' || Number.isInteger(value)

function intResolve(sign, src, radix) {
  let str = src.replace(/_/g, '')
  if (intOptions.asBigInt) {
    switch (radix) {
      case 2:
        str = `0b${str}`
        break
      case 8:
        str = `0o${str}`
        break
      case 16:
        str = `0x${str}`
        break
    }
    const n = BigInt(str)
    return sign === '-' ? BigInt(-1) * n : n
  }
  const n = parseInt(str, radix)
  return sign === '-' ? -1 * n : n
}

function intStringify(node, radix, prefix) {
  const { value } = node
  if (intIdentify(value)) {
    const str = value.toString(radix)
    return value < 0 ? '-' + prefix + str.substr(1) : prefix + str
  }
  return stringifyNumber(node)
}

export const yaml11 = failsafe.concat(
  [
    {
      identify: value => value == null,
      createNode: (schema, value, ctx) =>
        ctx.wrapScalars ? new Scalar(null) : null,
      default: true,
      tag: 'tag:yaml.org,2002:null',
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => null,
      options: nullOptions,
      stringify: () => nullOptions.nullStr
    },
    {
      identify: value => typeof value === 'boolean',
      default: true,
      tag: 'tag:yaml.org,2002:bool',
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => true,
      options: boolOptions,
      stringify: boolStringify
    },
    {
      identify: value => typeof value === 'boolean',
      default: true,
      tag: 'tag:yaml.org,2002:bool',
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,
      resolve: () => false,
      options: boolOptions,
      stringify: boolStringify
    },
    {
      identify: intIdentify,
      default: true,
      tag: 'tag:yaml.org,2002:int',
      format: 'BIN',
      test: /^([-+]?)0b([0-1_]+)$/,
      resolve: (str, sign, bin) => intResolve(sign, bin, 2),
      stringify: node => intStringify(node, 2, '0b')
    },
    {
      identify: intIdentify,
      default: true,
      tag: 'tag:yaml.org,2002:int',
      format: 'OCT',
      test: /^([-+]?)0([0-7_]+)$/,
      resolve: (str, sign, oct) => intResolve(sign, oct, 8),
      stringify: node => intStringify(node, 8, '0')
    },
    {
      identify: intIdentify,
      default: true,
      tag: 'tag:yaml.org,2002:int',
      test: /^([-+]?)([0-9][0-9_]*)$/,
      resolve: (str, sign, abs) => intResolve(sign, abs, 10),
      stringify: stringifyNumber
    },
    {
      identify: intIdentify,
      default: true,
      tag: 'tag:yaml.org,2002:int',
      format: 'HEX',
      test: /^([-+]?)0x([0-9a-fA-F_]+)$/,
      resolve: (str, sign, hex) => intResolve(sign, hex, 16),
      stringify: node => intStringify(node, 16, '0x')
    },
    {
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
    },
    {
      identify: value => typeof value === 'number',
      default: true,
      tag: 'tag:yaml.org,2002:float',
      format: 'EXP',
      test: /^[-+]?([0-9][0-9_]*)?(\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: str => parseFloat(str.replace(/_/g, '')),
      stringify: ({ value }) => Number(value).toExponential()
    },
    {
      identify: value => typeof value === 'number',
      default: true,
      tag: 'tag:yaml.org,2002:float',
      test: /^[-+]?(?:[0-9][0-9_]*)?\.([0-9_]*)$/,
      resolve(str, frac) {
        const node = new Scalar(parseFloat(str.replace(/_/g, '')))
        if (frac) {
          const f = frac.replace(/_/g, '')
          if (f[f.length - 1] === '0') node.minFractionDigits = f.length
        }
        return node
      },
      stringify: stringifyNumber
    }
  ],
  binary,
  omap,
  pairs,
  set,
  intTime,
  floatTime,
  timestamp
)
