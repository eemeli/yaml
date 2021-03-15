import type { Scalar } from '../../nodes/Scalar.js'
import type { ParseOptions } from '../../options.js'
import { stringifyNumber } from '../../stringify/stringifyNumber.js'
import type { ScalarTag } from '../types.js'

const intIdentify = (value: unknown): value is number | bigint =>
  typeof value === 'bigint' || Number.isInteger(value)

const intResolve = (
  str: string,
  offset: number,
  radix: number,
  { intAsBigInt }: ParseOptions
) => (intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix))

function intStringify(node: Scalar, radix: number, prefix: string) {
  const { value } = node
  if (intIdentify(value) && value >= 0) return prefix + value.toString(radix)
  return stringifyNumber(node)
}

export const intOct: ScalarTag = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: /^0o[0-7]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
  stringify: node => intStringify(node, 8, '0o')
}

export const int: ScalarTag = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: /^[-+]?[0-9]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
  stringify: stringifyNumber
}

export const intHex: ScalarTag = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: /^0x[0-9a-fA-F]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
  stringify: node => intStringify(node, 16, '0x')
}
