import failsafe from './failsafe'

export const stringifyNumber = ({ value }) =>
  isFinite(value)
    ? JSON.stringify(value)
    : isNaN(value)
    ? '.nan'
    : value < 0
    ? '-.inf'
    : '.inf'

export const nullOptions = { nullStr: 'null' }

export default failsafe.concat([
  {
    class: null,
    default: true,
    tag: 'tag:yaml.org,2002:null',
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => null,
    options: nullOptions,
    stringify: () => nullOptions.nullStr
  },
  {
    class: Boolean,
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: str => str[0] === 't' || str[0] === 'T'
  },
  {
    class: Number,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'OCT',
    test: /^0o([0-7]+)$/,
    resolve: (str, oct) => parseInt(oct, 8),
    stringify: ({ value }) => '0o' + value.toString(8)
  },
  {
    class: Number,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9]+$/,
    resolve: str => parseInt(str, 10),
    stringify: stringifyNumber
  },
  {
    class: Number,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    format: 'HEX',
    test: /^0x([0-9a-fA-F]+)$/,
    resolve: (str, hex) => parseInt(hex, 16),
    stringify: ({ value }) => '0x' + value.toString(16)
  },
  {
    class: Number,
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
    class: Number,
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^[-+]?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][-+]?[0-9]+)?$/,
    resolve: str => parseFloat(str),
    stringify: stringifyNumber
  }
])
