import { Type } from 'raw-yaml'
import Map from './Map'
import Seq from './Seq'
import { str } from './_string'

export const map = {
  tag: 'tag:yaml.org,2002:map',
  resolve: (doc, node) => new Map(doc, node),
  class: Map,
  stringify: (value) => value.toString()
}

export const seq = {
  tag: 'tag:yaml.org,2002:seq',
  resolve: (doc, node) => new Seq(doc, node),
  class: Seq,
  stringify: (value) => value.toString()
}

export default [
  map,
  seq,
  str
]
