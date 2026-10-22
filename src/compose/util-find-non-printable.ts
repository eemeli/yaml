/**
 * Matches characters that are not printable according to the YAML spec,
 * i.e. C0 control characters other than tab, LF and CR, DEL, C1 control
 * characters other than NEL, and lone surrogates. Valid surrogate pairs
 * are not matched. Neither are U+FFFE & U+FFFF, which the stringifier
 * similarly emits as-is.
 */
const nonPrintableRe =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u0080-\u0084\u0086-\u009f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/

/**
 * Like `nonPrintableRe`, for individual characters in the source of a
 * double-quoted scalar. DEL is not matched here, as it is valid
 * unescaped in JSON strings, and neither are surrogates, which are
 * handled separately to account for valid pairs.
 */
const rawNonPrintableRe =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u0080-\u0084\u0086-\u009f]/

/**
 * Returns the index of the first non-printable character in `value`,
 * or -1 if there is none.
 */
export function findNonPrintable(value: string): number {
  const match = nonPrintableRe.exec(value)
  return match ? match.index : -1
}

/**
 * Returns the index of the first non-printable character in the source
 * of a double-quoted scalar, or -1 if there is none. Characters
 * included via escape sequences are valid, and are not reported.
 */
export function findRawNonPrintable(source: string): number {
  for (let i = 0; i < source.length; ++i) {
    const ch = source[i]
    if (ch === '\\') {
      i += 1
      continue
    }
    const cc = source.charCodeAt(i)
    if (cc >= 0xd800 && cc <= 0xdbff) {
      const next = source.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff)
        i += 1 // valid surrogate pair
      else return i // lone high surrogate
    } else if (cc >= 0xdc00 && cc <= 0xdfff) {
      return i // lone low surrogate
    } else if (rawNonPrintableRe.test(ch)) return i
  }
  return -1
}
