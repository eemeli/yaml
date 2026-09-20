import type { ErrorCode } from '../errors.ts'
import type { ComposeErrorHandler } from './composer.ts'

/**
 * Characters excluded from YAML 1.2 c-printable:
 * C0 controls except TAB/LF/CR, DEL, C1 except NEL, surrogates, U+FFFE, U+FFFF.
 * @see https://yaml.org/spec/1.2.2/#rule-c-printable
 */
const NON_PRINTABLE =
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\u{D800}-\u{DFFF}\u{FFFE}\u{FFFF}]/gu

export function checkPrintable(
  source: string,
  offset: number,
  onError: ComposeErrorHandler
): void {
  NON_PRINTABLE.lastIndex = 0
  const match = NON_PRINTABLE.exec(source)
  if (!match) return
  const cp = match[0].codePointAt(0)!
  const hex = cp.toString(16).toUpperCase().padStart(4, '0')
  onError(
    offset + match.index,
    'NON_PRINTABLE' as ErrorCode,
    `Input contains non-printable character U+${hex}`
  )
}
