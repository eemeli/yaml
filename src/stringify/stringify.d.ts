import type { Document } from '../doc/Document'

export interface StringifyContext {
  doc: Document
  forceBlockIndent?: boolean
  implicitKey?: boolean
  indent: string
  indentStep: string
  indentAtStart?: number
  inFlow?: boolean
  stringify: typeof stringify
  [key: string]: unknown
}

export function stringify(
  item: unknown,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string
