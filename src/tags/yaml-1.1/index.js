import { Scalar } from '../../schema/Scalar'
import { stringifyNumber } from '../../stringify'
import { failsafe } from '../failsafe'
import { boolOptions, nullOptions } from '../options'
import { binary } from './binary'
import { omap } from './omap'
import { pairs } from './pairs'
import { set } from './set'
import { intTime, floatTime, timestamp } from './timestamp'

const boolStringify = ({ value }) =>
  value ? boolOptions.trueStr : boolOptions.falseStr

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
      identify: value => typeof value === 'number',
      default: true,
      tag: 'tag:yaml.org,2002:int',
      format: 'BIN',
      test: /^0b([0-1_]+)$/,
      resolve: (str, bin) => parseInt(bin.replace(/_/g, ''), 2),
      stringify: ({ value }) => '0b' + value.toString(2)
    },
    {
      identify: value => typeof value === 'number',
      default: true,
      tag: 'tag:yaml.org,2002:int',
      format: 'OCT',
      test: /^[-+]?0([0-7_]+)$/,
      resolve: (str, oct) => parseInt(oct.replace(/_/g, ''), 8),
      stringify: ({ value }) => (value < 0 ? '-0' : '0') + value.toString(8)
    },
    {
      identify: value => typeof value === 'number',
      default: true,
      tag: 'tag:yaml.org,2002:int',
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: str => parseInt(str.replace(/_/g, ''), 10),
      stringify: stringifyNumber
    },
    {
      identify: value => typeof value === 'number',
      default: true,
      tag: 'tag:yaml.org,2002:int',
      format: 'HEX',
      test: /^0x([0-9a-fA-F_]+)$/,
      resolve: (str, hex) => parseInt(hex.replace(/_/g, ''), 16),
      stringify: ({ value }) => (value < 0 ? '-0x' : '0x') + value.toString(16)
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
