import failsafe from './failsafe'

export const stringifyFloat = (value) => (
  isFinite(value) ? JSON.stringify(value)
  : isNaN(value) ? '.nan'
  : value < 0 ? '-.inf'
  : '.inf'
)

export default failsafe.concat([
  {
    tag: 'tag:yaml.org,2002:null',
    test: /^(?:~|null)?$/i,
    resolve: () => null,
    stringify: (value, { nullStr }) => nullStr
  },
  {
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:true|false)$/i,
    resolve: (str) => (str[0] === 't' || str[0] === 'T')
  },
  {
    tag: 'tag:yaml.org,2002:int',
    format: 'oct',
    test: /^0o([0-7]+)$/,
    resolve: (str, oct) => parseInt(oct, 8),
    stringify: (value) => '0o' + value.toString(8)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9]+$/,
    resolve: (str) => parseInt(str, 10)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    format: 'hex',
    test: /^0x([0-9a-fA-F]+)$/,
    resolve: (str, hex) => parseInt(hex, 16),
    stringify: (value) => '0x' + value.toString(16)
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
    test: /^[-+]?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str),
    stringify: stringifyFloat
  }
])
