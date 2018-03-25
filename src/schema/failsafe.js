import { Type } from '../ast/Node'
import Map from './Map'
import Seq from './Seq'
import { str } from './_string'

export const map = {
  class: Map,
  tag: 'tag:yaml.org,2002:map',
  resolve: (doc, node) => new Map(doc, node),
  stringify: (value, { indent, inFlow }, onComment) => value.toString(indent, inFlow, onComment)
}

export const seq = {
  class: Seq,
  tag: 'tag:yaml.org,2002:seq',
  resolve: (doc, node) => new Seq(doc, node),
  stringify: (value, { indent, inFlow }, onComment) => value.toString(indent, inFlow, onComment)
}

export default [
  map,
  seq,
  str
]
