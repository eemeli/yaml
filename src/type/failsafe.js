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
  }
]
