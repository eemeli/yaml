import { Scalar } from '../ast/Scalar'

// falls back to string on no match
export function resolveScalar(str, tags, scalarFallback) {
  for (const { format, test, resolve } of tags) {
    if (test) {
      const match = str.match(test)
      if (match) {
        let res = resolve.apply(null, match)
        if (!(res instanceof Scalar)) res = new Scalar(res)
        if (format) res.format = format
        return res
      }
    }
  }
  if (scalarFallback) str = scalarFallback(str)
  return new Scalar(str)
}
