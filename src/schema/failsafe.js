import YAMLMap from './Map'
import YAMLSeq from './Seq'
import { str } from './_string'
import parseMap from './parseMap'
import parseSeq from './parseSeq'

export const map = {
  nodeClass: YAMLMap,
  default: true,
  tag: 'tag:yaml.org,2002:map',
  resolve: parseMap,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}

export const seq = {
  nodeClass: YAMLSeq,
  default: true,
  tag: 'tag:yaml.org,2002:seq',
  resolve: parseSeq,
  stringify: (value, ctx, onComment, onChompKeep) =>
    value.toString(ctx, onComment, onChompKeep)
}

export default [map, seq, str]
