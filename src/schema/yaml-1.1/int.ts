import type { Scalar } from '../../nodes/Scalar.js'
import type { ParseOptions } from '../../options.js'
import { stringifyNumber } from '../../stringify/stringifyNumber.js'
import type { ScalarTag } from '../types.js'

const intIdentify = (value: unknown): value is number | bigint =>
  typeof value === 'bigint' || Number.isInteger(value)

function intResolve(
  str: string,
  offset: number,
  radix: number,
  { intAsBigInt }: ParseOptions
) {
  const sign = str[0]
  if (sign === '-' || sign === '+') offset += 1
  str = str.substring(offset).replace(/_/g, '')
  if (intAsBigInt) {
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

function intStringify(node: Scalar, radix: number, prefix: string) {
  const { value } = node
  if (intIdentify(value)) {
    const str = value.toString(radix)
    return value < 0 ? '-' + prefix + str.substr(1) : prefix + str
  }
  return stringifyNumber(node)
}

export const intBin: ScalarTag = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'BIN',
  test: /^[-+]?0b[0-1_]+$/,
  resolve: (str: string, _onError: unknown, opt: ParseOptions) =>
    intResolve(str, 2, 2, opt),
  stringify: node => intStringify(node, 2, '0b')
}

export const intOct: ScalarTag = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^[-+]?0[0-7_]+$/,
  resolve: (str: string, _onError: unknown, opt: ParseOptions) =>
    intResolve(str, 1, 8, opt),
  stringify: node => intStringify(node, 8, '0')
}

export const int: ScalarTag = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: (str: string, _onError: unknown, opt: ParseOptions) =>
    intResolve(str, 0, 10, opt),
  stringify: stringifyNumber
}

export const intHex: ScalarTag = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^[-+]?0x[0-9a-fA-F_]+$/,
  resolve: (str: string, _onError: unknown, opt: ParseOptions) =>
    intResolve(str, 2, 16, opt),
  stringify: node => intStringify(node, 16, '0x')
}
