import { Type } from '../ast/Node'
import Map from './Map'
import Seq from './Seq'
import { str } from './_string'

export const map = {
  class: Map,
  tag: 'tag:yaml.org,2002:map',
  resolve: (doc, node) => new Map(doc, node),
  strIncludesComment: true,
  stringify: (value, { indent, inFlow }) => value.toString(indent, inFlow)
}

export const seq = {
  class: Seq,
  tag: 'tag:yaml.org,2002:seq',
  resolve: (doc, node) => new Seq(doc, node),
  strIncludesComment: true,
  stringify: (value, { indent, inFlow }) => value.toString(indent, inFlow)
}

export default [
  map,
  seq,
  str
]
