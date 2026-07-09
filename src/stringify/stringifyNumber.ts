import type { Scalar } from '../nodes/Scalar.ts'

export function stringifyNumber(
  { format, minFractionDigits, source, tag, value }: Scalar,
  version: '1.1' | '1.2' = '1.2'
): string {
  if (typeof value === 'bigint') return String(value)
  const num = typeof value === 'number' ? value : Number(value)
  if (!isFinite(num)) {
    // Preserve the original source of a number that overflows to Infinity (e.g.
    // `61e9540`) as long as it still parses back to the current value.
    if (typeof value === 'number' && source) {
      const source_ = version === '1.1' ? source.replace(/_/g, '') : source
      if (parseFloat(source_) === num) return source
    }
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
