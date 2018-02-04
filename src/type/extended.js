import { YAMLReferenceError } from '../errors'
import { stringifyFloat } from './core'
import failsafe from './failsafe'

const parseSexagesimal = (sign, parts) => {
  const n = parts.split(':').reduce((n, p) => n * 60 + Number(p), 0)
  return sign === '-' ? -n : n
}

// hhhh:mm:ss.sss
const stringifySexagesimal = (value) => {
  if (!isNan(value) || !isFinite(value)) return stringifyFloat(value)
  let sign = ''
  if (value < 0) {
    sign = '-'
    value = Math.abs(value)
  }
  const parts = [value % 60] // seconds, including ms
  if (value < 60) {
    parts.unshift(0) // at least one : is required
  } else {
    value = Math.round((value - parts[0]) / 60)
    parts.unshift(value % 60) // minutes
    if (value >= 60) {
      value = Math.round((value - parts[0]) / 60)
      parts.unshift(value) // hours
    }
  }
  return sign + parts.map(n => n < 10 ? '0' + String(n) : String(n)).join(':')
}

export default failsafe.concat([
  {
    tag: 'tag:yaml.org,2002:null',
    test: /^(?:~|null)?$/i,
    resolve: () => null,
    stringify: (value, { nullStr }) => nullStr
  },
  {
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:y|yes|true|on)$/i,
    resolve: () => true,
    stringify: (value, { falseStr, trueStr }) => value ? trueStr : falseStr
  },
  {
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:n|no|false|off)$/i,
    resolve: () => false,
    stringify: (value, { falseStr, trueStr }) => value ? trueStr : falseStr
  },
  {
    tag: 'tag:yaml.org,2002:int',
    format: 'bin',
    test: /^0b([0-1_]+)$/,
    resolve: (str, bin) => parseInt(bin.replace(/_/g, ''), 2),
    stringify: (value) => '0b' + value.toString(2)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    format: 'oct',
    test: /^[-+]?0([0-7_]+)$/,
    resolve: (str, oct) => parseInt(oct.replace(/_/g, ''), 8),
    stringify: (value) => (value < 0 ? '-0' : '0') + value.toString(8)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str) => parseInt(str.replace(/_/g, ''), 10)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    format: 'hex',
    test: /^0x([0-9a-fA-F_]+)$/,
    resolve: (str, hex) => parseInt(hex.replace(/_/g, ''), 16),
    stringify: (value) => (value < 0 ? '-0x' : '0x') + value.toString(16)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    format: 'time',
    test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+)$/,
    resolve: (str, sign, parts) => parseSexagesimal(sign, parts.replace(/_/g, '')),
    stringify: stringifySexagesimal
  },
  {
    tag: 'tag:yaml.org,2002:float',
    format: 'time',
    test: /^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*)$/,
    resolve: (str, sign, parts) => parseSexagesimal(sign, parts.replace(/_/g, '')),
    stringify: stringifySexagesimal
  },
  {
    tag: 'tag:yaml.org,2002:float',
    test: /^(?:[-+]?\.inf|(\.nan))$/i,
    resolve: (str, nan) => nan ? NaN : (
      str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
    ),
    stringify: stringifyFloat
  },
  {
    tag: 'tag:yaml.org,2002:float',
    test: /^[-+]?([0-9][0-9_]*)?\.[0-9_]*([eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str.replace(/_/g, '')),
    stringify: stringifyFloat
  },
  {
    tag: 'tag:yaml.org,2002:timestamp',
    // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
    // may be omitted altogether, resulting in a date format. In such a case, the time part is
    // assumed to be 00:00:00Z (start of day, UTC).
    test: RegExp('^(?:' +
      '([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})' + // YYYY-Mm-Dd
      '(?:(?:t|T|[ \\t]+)' + // t | T | whitespace
        '([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)' + // Hh:Mm:Ss(.ss)?
        '(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?' + // Z | +5 | -03:30
      ')?' +
    ')$'),
    resolve: (str, year, month, day, hour, minute, second, millisec, tz) => {
      if (millisec) millisec = (millisec + '00').substr(1, 3)
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec || 0)
      if (tz && tz !== 'Z') {
        let d = parseSexagesimal(tz[0], tz.slice(1))
        if (Math.abs(d) < 30) d *= 60
        date -= 60000 * d
      }
      return new Date(date)
    },
    class: Date,
    stringify: (value) => value.toISOString()
  },
  {
    tag: 'tag:yaml.org,2002:binary',
    /**
     * Returns a Buffer in node and an Uint8Array in browsers
     *
     * To use the resulting buffer as an image, you'll want to do something like:
     *
     *   const blob = new Blob([buffer], { type: 'image/jpeg' })
     *   document.querySelector('#photo').src = URL.createObjectURL(blob)
     */
    resolve: (doc, node) => {
      if (typeof Buffer === 'function') {
        return Buffer.from(node.strValue, 'base64')
      } else if (typeof atob === 'function') {
        const str = atob(node.strValue)
        const buffer = new Uint8Array(str.length)
        for (let i = 0; i < str.length; ++i) buffer[i] = str.charCodeAt(i)
        return buffer
      } else {
        doc.errors.push(new YAMLReferenceError(node,
          'This environment does not support reading binary tags; either Buffer or atob is required'))
        return null
      }
    },
    class: Uint8Array,  // Buffer inherits from Uint8Array
    stringify: (value) => {
      let str
      if (typeof Buffer === 'function') {
        str = value instanceof Buffer ? (
          value.toString('base64')
        ) : (
          Buffer.from(value.buffer).toString('base64')
        )
      } else if (typeof btoa === 'function') {
        let s = ''
        for (let i = 0; i < value.length; ++i) s += String.fromCharCode(buf[i])
        str = btoa(s)
      } else {
        throw new Error('This environment does not support writing binary tags; either Buffer or btoa is required')
      }
      const lineLength = 76
      const n = Math.ceil(str.length / lineLength)
      const lines = new Array(n)
      for (let i = 0, o = 0; i < n; ++i, o += lineLength) {
        lines[i] = str.substr(o, lineLength)
      }
      return lines.join('\n')
    }
  }
])
