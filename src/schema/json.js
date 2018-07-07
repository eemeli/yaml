import { map, seq } from './failsafe'
import { resolve as resolveStr } from './_string'

const schema = [
  map,
  seq,
  {
    class: String,
    default: true,
    tag: 'tag:yaml.org,2002:str',
    resolve: resolveStr
  },
  {
    class: null,
    default: true,
    tag: 'tag:yaml.org,2002:null',
    test: /^null$/,
    resolve: () => null
  },
  {
    class: Boolean,
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^true$/,
    resolve: () => true
  },
  {
    class: Boolean,
    default: true,
    tag: 'tag:yaml.org,2002:bool',
    test: /^false$/,
    resolve: () => false
  },
  {
    class: Number,
    default: true,
    tag: 'tag:yaml.org,2002:int',
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: str => parseInt(str, 10)
  },
  {
    class: Number,
    default: true,
    tag: 'tag:yaml.org,2002:float',
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: str => parseFloat(str)
  }
]

schema.scalarFallback = str => {
  throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(str)}`)
}

export default schema
