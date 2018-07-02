import { YAMLReferenceError } from '../errors'
import binary from './_binary'
import timestamp from './_timestamp'
import { stringifyNumber } from './core'
import failsafe from './failsafe'

export const nullOptions = { nullStr: 'null' }
export const boolOptions = { trueStr: 'true', falseStr: 'false' }

export default failsafe.concat(
  [
    {
      class: null,
      tag: 'tag:yaml.org,2002:null',
      test: /^(?:~|null)?$/i,
      resolve: () => null,
      options: nullOptions,
      stringify: () => nullOptions.nullStr
    },
    {
      class: Boolean,
      tag: 'tag:yaml.org,2002:bool',
      test: /^(?:y|yes|true|on)$/i,
      resolve: () => true,
      options: boolOptions,
      stringify: ({ value }) =>
        value ? boolOptions.trueStr : boolOptions.falseStr
    },
    {
      class: Boolean,
      tag: 'tag:yaml.org,2002:bool',
      test: /^(?:n|no|false|off)$/i,
      resolve: () => false,
      options: boolOptions,
      stringify: ({ value }) =>
        value ? boolOptions.trueStr : boolOptions.falseStr
    },
    {
      class: Number,
      tag: 'tag:yaml.org,2002:int',
      format: 'bin',
      test: /^0b([0-1_]+)$/,
      resolve: (str, bin) => parseInt(bin.replace(/_/g, ''), 2),
      stringify: ({ value }) => '0b' + value.toString(2)
    },
    {
      class: Number,
      tag: 'tag:yaml.org,2002:int',
      format: 'oct',
      test: /^[-+]?0([0-7_]+)$/,
      resolve: (str, oct) => parseInt(oct.replace(/_/g, ''), 8),
      stringify: ({ value }) => (value < 0 ? '-0' : '0') + value.toString(8)
    },
    {
      class: Number,
      tag: 'tag:yaml.org,2002:int',
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: str => parseInt(str.replace(/_/g, ''), 10),
      stringify: stringifyNumber
    },
    {
      class: Number,
      tag: 'tag:yaml.org,2002:int',
      format: 'hex',
      test: /^0x([0-9a-fA-F_]+)$/,
      resolve: (str, hex) => parseInt(hex.replace(/_/g, ''), 16),
      stringify: ({ value }) => (value < 0 ? '-0x' : '0x') + value.toString(16)
    },
    {
      class: Number,
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
      tag: 'tag:yaml.org,2002:float',
      test: /^[-+]?([0-9][0-9_]*)?\.[0-9_]*([eE][-+]?[0-9]+)?$/,
      resolve: str => parseFloat(str.replace(/_/g, '')),
      stringify: stringifyNumber
    }
  ],
  timestamp,
  binary
)
