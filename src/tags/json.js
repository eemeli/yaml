import map from './failsafe/map'
import seq from './failsafe/seq'
import Scalar from '../schema/Scalar'
import { resolveString } from './failsafe/string'

const schema = [
  map,
  seq,
  {
    identify: value => typeof value === 'string',
    default: true,
    tag: 'tag:yaml.org,2002:str',
    resolve: resolveString,
    stringify: value => JSON.stringify(value)
  },
  {
    identify: value => value == null,
    createNode: (schema, value, ctx) =>
      ctx.wrapScalars ? new Scalar(null) : null,
    default: true,
    tag: 'tag:yaml.org,2002:null',
    test: /^null$/,
    resolve: () => null,
    stringify: value => JSON.stringify(value)
  },
  {
    identify: value => typeof value === 'boolean',
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^true|false$/,
    resolve: str => str === 'true',
    stringify: value => JSON.stringify(value)
  },
  {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: str => parseInt(str, 10),
    stringify: value => JSON.stringify(value)
  },
  {
    identify: value => typeof value === 'number',
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: str => parseFloat(str),
    stringify: value => JSON.stringify(value)
  }
]

schema.scalarFallback = str => {
  throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(str)}`)
}

export default schema
