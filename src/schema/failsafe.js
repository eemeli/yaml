import Map from './Map'
import Seq from './Seq'
import { str } from './_string'
import parseMap from './parseMap'

export const map = {
  class: Map,
  tag: 'tag:yaml.org,2002:map',
  resolve: (doc, node) => parseMap(doc, new Map(), node),
  stringify: (value, ctx, onComment) => value.toString(ctx, onComment)
}

export const seq = {
  class: Seq,
  tag: 'tag:yaml.org,2002:seq',
  resolve: (doc, node) => new Seq(doc).parse(node),
  stringify: (value, ctx, onComment) => value.toString(ctx, onComment)
}

export default [map, seq, str]
