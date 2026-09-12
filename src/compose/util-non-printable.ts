import type { ErrorCode } from '../errors.ts'

type NonPrintableErrorHandler = (
  index: number,
  code: ErrorCode,
  message: string
) => void

/**
 * Check that the raw source of a scalar does not include any C0 control
 * characters, which are excluded from the `c-printable` production of the
 * YAML spec: the tab, line feed and carriage return characters are allowed,
 * but any other use of such a character needs an escape sequence within a
 * double-quoted scalar.
 *
 * https://yaml.org/spec/1.2.2/#rule-c-printable
 *
 * The other `c-printable` exclusions (DEL, C1 control characters, U+FFFE,
 * U+FFFF) are not checked here, as JSON allows those characters as-is within
 * strings, and this library aims to parse valid JSON as YAML.
 */
export function checkNonPrintable(
  source: string,
  onError: NonPrintableErrorHandler
): void {
  for (let i = 0; i < source.length; ++i) {
    const cc = source.charCodeAt(i)
    if (cc < 0x20 && cc !== 0x09 && cc !== 0x0a && cc !== 0x0d) {
      const hex = '0x' + cc.toString(16).padStart(2, '0')
      onError(i, 'NON_PRINTABLE_CHAR', `Non-printable character ${hex}`)
    }
  }
}
