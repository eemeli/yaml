/* global BigInt */

import { map } from './failsafe/map'
import { seq } from './failsafe/seq'
import { Scalar } from '../schema/Scalar'
import { resolveString } from './failsafe/string'
import { intOptions } from './options'

const intIdentify = value =>
  typeof value === 'bigint' || Number.isInteger(value)

const stringifyJSON = ({ value }) => JSON.stringify(value)

export const json = [
  map,
  seq,
  {
    identify: value => typeof value === 'string',
    default: true,
    tag: 'tag:yaml.org,2002:str',
    resolve: resolveString,
    stringify: stringifyJSON
  },
  {
    identify: value => value == null,
    createNode: (schema, value, ctx) =>
      ctx.wrapScalars ? new Scalar(null) : null,
    default: true,
    tag: 'tag:yaml.org,2002:null',
    test: /^null$/,
    resolve: () => null,
    stringify: stringifyJSON
  },
  {
    identify: value => typeof value === 'boolean',
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^true|false$/,
    resolve: str => str === 'true',
    stringify: stringifyJSON
  },
  {
    identify: intIdentify,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: str => (intOptions.asBigInt ? BigInt(str) : parseInt(str, 10)),
    stringify: ({ value }) =>
      intIdentify(value) ? value.toString() : JSON.stringify(value)
  },
  {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: str => parseFloat(str),
    stringify: stringifyJSON
  }
]

json.scalarFallback = str => {
  throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(str)}`)
}
