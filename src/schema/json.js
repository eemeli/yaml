import { map, seq } from './failsafe'

const schema = [
  map,
  seq,
  {
    tag: 'tag:yaml.org,2002:str',
    resolve: (doc, node) => node.strValue || '',
    stringify: JSON.stringify
  },
  {
    tag: 'tag:yaml.org,2002:null',
    test: /^null$/,
    resolve: () => null
  },
  {
    tag: 'tag:yaml.org,2002:bool',
    test: /^true$/,
    resolve: () => true
  },
  {
    tag: 'tag:yaml.org,2002:bool',
    test: /^false$/,
    resolve: () => false
  },
  {
    tag: 'tag:yaml.org,2002:int',
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: (str) => parseInt(str, 10)
  },
  {
    tag: 'tag:yaml.org,2002:float',
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str)
  }
]

schema.scalarFallback = (str) => {
  throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(str)}`)
}

export default schema
