import Map from './Map'
import Seq from './Seq'

export default [
  {
    tag: 'tag:yaml.org,2002:map',
    resolve: (doc, node) => new Map(doc, node)
  },
  {
    tag: 'tag:yaml.org,2002:seq',
    resolve: (doc, node) => new Seq(doc, node)
  },
  {
    tag: 'tag:yaml.org,2002:str',
    resolve: (doc, node) => node.strValue || ''
  },
  {
    tag: 'tag:yaml.org,2002:null',
    test: /^(?:~|null)?$/i,
    resolve: () => null
  },
  {
    tag: 'tag:yaml.org,2002:bool',
    test: /^(?:true|false)$/i,
    resolve: (str) => (str[0] === 't' || str[0] === 'T')
  },
  {
    tag: 'tag:yaml.org,2002:int',
    test: /^0o[0-7]+$/,
    resolve: (str) => parseInt(str, 8)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    test: /^[-+]?[0-9]+$/,
    resolve: (str) => parseInt(str, 10)
  },
  {
    tag: 'tag:yaml.org,2002:int',
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str) => parseInt(str, 16)
  },
  {
    tag: 'tag:yaml.org,2002:float',
    test: /^(?:[-+]?\.inf|(\.nan))$/i,
    resolve: (str, nan) => nan ? NaN : (
      str[0] === '-' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
    )
  },
  {
    tag: 'tag:yaml.org,2002:float',
    test: /^[-+]?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str)
  }
]
