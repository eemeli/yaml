import { Scalar } from '../../nodes/Scalar.js'
import { map } from '../common/map.js'
import { seq } from '../common/seq.js'
import { CollectionTag, ScalarTag } from '../types.js'

function intIdentify(value: unknown): value is number | bigint {
  return typeof value === 'bigint' || Number.isInteger(value)
}

const stringifyJSON = ({ value }: Scalar) => JSON.stringify(value)

const jsonScalars: ScalarTag[] = [
  {
    identify: value => typeof value === 'string',
    default: true,
    tag: 'tag:yaml.org,2002:str',
    resolve: str => str,
    stringify: stringifyJSON
  },
  {
    identify: value => value == null,
    createNode: () => new Scalar(null),
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
    resolve: (str, _onError, { intAsBigInt }) =>
      intAsBigInt ? BigInt(str) : parseInt(str, 10),
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

const jsonError: ScalarTag = {
  default: true,
  tag: '',
  test: /^/,
  resolve(str, onError) {
    onError(`Unresolved plain scalar ${JSON.stringify(str)}`)
    return str
  }
}

export const schema = ([map, seq] as Array<CollectionTag | ScalarTag>).concat(
  jsonScalars,
  jsonError
)
