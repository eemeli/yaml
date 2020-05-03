import { resolveString } from '../../resolve/resolveString'
import { stringifyString } from '../../stringify/stringifyString'
import { strOptions } from '../options'

export const string = {
  identify: value => typeof value === 'string',
  default: true,
  tag: 'tag:yaml.org,2002:str',
  resolve: resolveString,
  stringify(item, ctx, onComment, onChompKeep) {
    ctx = Object.assign({ actualString: true }, ctx)
    return stringifyString(item, ctx, onComment, onChompKeep)
  },
  options: strOptions
}
