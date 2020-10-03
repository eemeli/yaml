// on error, strValue may be { str: string, errors: Error[] }
export function resolveString(strValue, onError) {
  const res = strValue
  if (!res) return ''
  if (typeof res === 'string') return res
  res.errors.forEach(onError)
  return res.str
}
