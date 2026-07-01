import type { Scalar } from '../nodes/Scalar.ts'

export function stringifyNumber({
  format,
  minFractionDigits,
  source,
  tag,
  value
}: Scalar): string {
  if (typeof value === 'bigint') return String(value)
  const num = typeof value === 'number' ? value : Number(value)
  if (!isFinite(num)) {
    // A number whose magnitude overflows the JS Number range (e.g. a git sha like
    // `61e9540`) resolves to Infinity but keeps its original source. Emit that
    // source rather than losing the value to `.inf`, as long as it still round-trips
    // to the current value (so a later programmatic edit is not masked by stale source).
    if (source && Number(source) === num) return source
    return isNaN(num) ? '.nan' : num < 0 ? '-.inf' : '.inf'
  }
  let n = Object.is(value, -0) ? '-0' : JSON.stringify(value)
  if (
    !format &&
    minFractionDigits &&
    (!tag || tag === 'tag:yaml.org,2002:float') &&
    /^-?\d/.test(n) &&
    !n.includes('e')
  ) {
    let i = n.indexOf('.')
    if (i < 0) {
      i = n.length
      n += '.'
    }
    let d = minFractionDigits - (n.length - i - 1)
    while (d-- > 0) n += '0'
  }
  return n
}
