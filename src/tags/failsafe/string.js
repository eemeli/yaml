import { resolveString } from '../../resolve/resolveString.js'
import { stringifyString } from '../../stringify/stringifyString.js'
import { strOptions } from '../options.js'

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
