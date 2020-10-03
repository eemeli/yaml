import { Scalar } from '../ast/Scalar.js'

export function resolveScalar(str, tags) {
  for (const { format, test, resolve } of tags) {
    if (test && test.test(str)) {
      let res = resolve(str)
      if (!(res instanceof Scalar)) res = new Scalar(res)
      if (format) res.format = format
      return res
    }
  }
  return new Scalar(str) // fallback to string
}
