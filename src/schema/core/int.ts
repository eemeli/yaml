import type { Scalar } from '../../nodes/Scalar.ts'
import type { ParseOptions } from '../../options.ts'
import { stringifyNumber } from '../../stringify/stringifyNumber.ts'
import type { ScalarTag } from '../types.ts'

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

function isOctInt(value: string) {
  if (value.length < 3 || value[0] !== '0' || value[1] !== 'o') return false
  for (let i = 2; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c < 0x30 || c > 0x37) return false // not 0-7
  }
  return true
}

function isInt(value: string) {
  let i = 0
  if (value.length === 0) return false
  if (value.charCodeAt(0) === 0x2b || value.charCodeAt(0) === 0x2d) i = 1 // +/-
  if (i === value.length) return false
  for (; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c < 0x30 || c > 0x39) return false // not 0-9
  }
  return true
}

function isHexInt(value: string) {
  if (value.length < 3 || value[0] !== '0' || value[1] !== 'x') return false
  for (let i = 2; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (
      !(c >= 0x30 && c <= 0x39) && // 0-9
      !(c >= 0x41 && c <= 0x46) && // A-F
      !(c >= 0x61 && c <= 0x66) // a-f
    )
      return false
  }
  return true
}

export const intOct: ScalarTag & { test: (value: string) => boolean } = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'OCT',
  test: isOctInt,
  resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
  stringify: node => intStringify(node, 8, '0o')
}

export const int: ScalarTag & { test: (value: string) => boolean } = {
  identify: intIdentify,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  test: isInt,
  resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
  stringify: node => stringifyNumber(node)
}

export const intHex: ScalarTag & { test: (value: string) => boolean } = {
  identify: value => intIdentify(value) && value >= 0,
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'HEX',
  test: isHexInt,
  resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
  stringify: node => intStringify(node, 16, '0x')
}
