// on error, will return { str: string, errors: Error[] }
export function resolveString(doc, node) {
  const res = node.strValue
  if (!res) return ''
  if (typeof res === 'string') return res
  res.errors.forEach(error => {
    if (!error.source) error.source = node
    doc.errors.push(error)
  })
  return res.str
}
