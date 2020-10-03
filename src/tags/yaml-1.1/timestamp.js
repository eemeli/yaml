import { intOptions } from '../options.js'
import { stringifyNumber } from '../../stringify/stringifyNumber.js'

const parseSexagesimal = (str, isInt) => {
  const sign = str[0]
  const parts = sign === '-' || sign === '+' ? str.substring(1) : str
  const num = n => (isInt && intOptions.asBigInt ? BigInt(n) : Number(n))
  const res = parts
    .replace(/_/g, '')
    .split(':')
    .reduce((res, p) => res * num(60) + num(p), num(0))
  return sign === '-' ? num(-1) * res : res
}

// hhhh:mm:ss.sss
const stringifySexagesimal = ({ value }) => {
  let num = n => n
  if (typeof value === 'bigint') num = n => BigInt(n)
  else if (isNaN(value) || !isFinite(value)) return stringifyNumber(value)
  let sign = ''
  if (value < 0) {
    sign = '-'
    value *= num(-1)
  }
  const _60 = num(60)
  const parts = [value % _60] // seconds, including ms
  if (value < 60) {
    parts.unshift(0) // at least one : is required
  } else {
    value = (value - parts[0]) / _60
    parts.unshift(value % _60) // minutes
    if (value >= 60) {
      value = (value - parts[0]) / _60
      parts.unshift(value) // hours
    }
  }
  return (
    sign +
    parts
      .map(n => (n < 10 ? '0' + String(n) : String(n)))
      .join(':')
      .replace(/000000\d*$/, '') // % 60 may introduce error
  )
}

export const intTime = {
  identify: value => typeof value === 'bigint' || Number.isInteger(value),
  default: true,
  tag: 'tag:yaml.org,2002:int',
  format: 'TIME',
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  resolve: str => parseSexagesimal(str, true),
  stringify: stringifySexagesimal
}

export const floatTime = {
  identify: value => typeof value === 'number',
  default: true,
  tag: 'tag:yaml.org,2002:float',
  format: 'TIME',
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  resolve: str => parseSexagesimal(str, false),
  stringify: stringifySexagesimal
}

export const timestamp = {
  identify: value => value instanceof Date,
  default: true,
  tag: 'tag:yaml.org,2002:timestamp',
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp(
    '^(?:' +
    '([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})' + // YYYY-Mm-Dd
    '(?:(?:t|T|[ \\t]+)' + // t | T | whitespace
    '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)' + // Hh:Mm:Ss(.ss)?
    '(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?' + // Z | +5 | -03:30
      ')?' +
      ')$'
  ),
  resolve: (str, year, month, day, hour, minute, second, millisec, tz) => {
    if (millisec) millisec = (millisec + '00').substr(1, 3)
    let date = Date.UTC(
      year,
      month - 1,
      day,
      hour || 0,
      minute || 0,
      second || 0,
      millisec || 0
    )
    if (tz && tz !== 'Z') {
      let d = parseSexagesimal(tz, false)
      if (Math.abs(d) < 30) d *= 60
      date -= 60000 * d
    }
    return new Date(date)
  },
  stringify: ({ value }) =>
    value.toISOString().replace(/((T00:00)?:00)?\.000Z$/, '')
}
