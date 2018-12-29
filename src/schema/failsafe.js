import Map from './Map'
import Seq from './Seq'
import { str } from './_string'
import parseMap from './parseMap'
import parseSeq from './parseSeq'

export const map = {
  class: Map,
  default: true,
  tag: 'tag:yaml.org,2002:map',
  resolve: parseMap,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}

export const seq = {
  class: Seq,
  default: true,
  tag: 'tag:yaml.org,2002:seq',
  resolve: parseSeq,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}

export default [map, seq, str]
