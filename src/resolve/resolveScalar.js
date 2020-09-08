import { Scalar } from '../ast/Scalar.js'

// match custom string on null/bool
function matchCustomTest(str, customTest) {
  if (!customTest) return false
  return customTest(str)
}

// falls back to string on no match
export function resolveScalar(str, tags, scalarFallback) {
  for (const { format, test, customTest, resolve } of tags) {
    if (test) {
      const match = str.match(test) || matchCustomTest(str, customTest)
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
