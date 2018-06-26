import { Type } from '../ast/Node'
import Map from './Map'
import Seq from './Seq'
import { str } from './_string'

export const map = {
  class: Map,
  tag: 'tag:yaml.org,2002:map',
  resolve: (doc, node) => new Map(doc).parse(node),
  stringify: (value, ctx, onComment) => value.toString(ctx, onComment)
}

export const seq = {
  class: Seq,
  tag: 'tag:yaml.org,2002:seq',
  resolve: (doc, node) => new Seq(doc).parse(node),
  stringify: (value, ctx, onComment) => value.toString(ctx, onComment)
}

export default [map, seq, str]
