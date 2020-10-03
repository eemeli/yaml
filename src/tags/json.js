/* global BigInt */

import { Scalar } from '../ast/Scalar.js'
import { resolveString } from '../resolve/resolveString.js'
import { map } from './failsafe/map.js'
import { seq } from './failsafe/seq.js'
import { intOptions } from './options.js'

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
    resolve: (doc, node) =>
      resolveString(node.strValue, error => doc.errors.push(error)),
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
