import stringify from '../../stringify'
import { strOptions } from '../options'

export const resolveString = (doc, node) => {
  // on error, will return { str: string, errors: Error[] }
  const res = node.strValue
  if (!res) return ''
  if (typeof res === 'string') return res
  res.errors.forEach(error => {
    if (!error.source) error.source = node
    doc.errors.push(error)
  })
  return res.str
}

export default {
  identify: value => typeof value === 'string',
  default: true,
  tag: 'tag:yaml.org,2002:str',
  resolve: resolveString,
  stringify(item, ctx, onComment, onChompKeep) {
    ctx = Object.assign({ actualString: true }, ctx)
    return stringify(item, ctx, onComment, onChompKeep)
  },
  options: strOptions
}
