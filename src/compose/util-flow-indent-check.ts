import { Token } from '../parse/cst'
import { ComposeErrorHandler } from './composer'

export function flowIndentCheck(
  indent: number,
  fc: Token | null | undefined,
  onError: ComposeErrorHandler
) {
  if (fc?.type === 'flow-collection') {
    const end = fc.end[0]
    if ((end.source === ']' || end.source === '}') && end.indent === indent) {
      const msg = 'Flow end indicator should be more indented than parent'
      onError(end, 'BAD_INDENT', msg, true)
    }
  }
}
