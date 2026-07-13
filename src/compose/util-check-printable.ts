import type { ComposeErrorHandler } from './composer.ts'

/**
 * C0 control characters that are excluded from the YAML 1.2 `c-printable`
 * production, i.e. every C0 control other than the allowed `\t` (#x9),
 * `\n` (#xA) and `\r` (#xD).
 *
 * See https://yaml.org/spec/1.2.2/#rule-c-printable
 */
const controlCharRe = /[\x00-\x08\x0b\x0c\x0e-\x1f]/g

/**
 * Reports a `CONTROL_CHAR` error for each C0 control character found in
 * `source`, positioned at `offset + index`.
 *
 * The check is applied to the raw scalar source rather than its resolved
 * value, so escape sequences in double-quoted scalars (e.g. `\t` or `\x07`)
 * are not affected.
 */
export function checkPrintableChars(
  source: string,
  offset: number,
  onError: ComposeErrorHandler
): void {
  controlCharRe.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = controlCharRe.exec(source)) !== null) {
    const hex = match[0]
      .charCodeAt(0)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
    onError(
      offset + match.index,
      'CONTROL_CHAR',
      `Control character \\x${hex} is not allowed and must be escaped`
    )
  }
}
