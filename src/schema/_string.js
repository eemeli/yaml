import stringify, { strOptions } from '../stringify'

export const resolve = (doc, node) => {
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

export const str = {
  identify: value => typeof value === 'string',
  default: true,
  tag: 'tag:yaml.org,2002:str',
  resolve,
  stringify,
  options: strOptions
}
