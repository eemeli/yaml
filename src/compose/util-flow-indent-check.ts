import { Token } from '../parse/cst'
import { ComposeErrorHandler } from './composer'
import { containsNewline } from './util-contains-newline'

export function flowIndentCheck(
  indent: number,
  fc: Token | null | undefined,
  onError: ComposeErrorHandler
) {
  if (fc?.type === 'flow-collection') {
    const end = fc.end[0]
    if (
      end.indent === indent &&
      (end.source === ']' || end.source === '}') &&
      containsNewline(fc)
    ) {
      const msg = 'Flow end indicator should be more indented than parent'
      onError(end, 'BAD_INDENT', msg, true)
    }
  }
}
