import type { ComposeErrorHandler } from './composer.ts'

const nonPrintable =
  /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x84\x86-\x9f\ud800-\udfff\ufffe\uffff]/gu

const nonPrintableQuoted = /[\x00-\x08\x0b\x0c\x0e-\x1f]/g

export function printableCheck(
  source: string,
  offset: number,
  quoted: boolean,
  onError: ComposeErrorHandler
): void {
  const re = quoted ? nonPrintableQuoted : nonPrintable
  for (const { 0: ch, index } of source.matchAll(re)) {
    const code = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
    const msg = `Invalid non-printable character U+${code}`
    onError(offset + index, 'NON_PRINTABLE_CHAR', msg)
  }
}
