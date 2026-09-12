import { stringifyString } from '../../stringify/stringifyString.ts'
import type { ScalarTag } from '../types.ts'

export const string: ScalarTag = {
  identify: value => typeof value === 'string' || JSON.isRawJSON?.(value),
  default: true,
  tag: 'tag:yaml.org,2002:str',
  resolve: str => str,
  stringify(item, ctx, onComment, onChompKeep) {
    ctx = { actualString: true, ...ctx }
    return stringifyString(item, ctx, onComment, onChompKeep)
  }
}
