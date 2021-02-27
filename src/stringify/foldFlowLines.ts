export const FOLD_FLOW = 'flow'
export const FOLD_BLOCK = 'block'
export const FOLD_QUOTED = 'quoted'

/**
 * `'block'` prevents more-indented lines from being folded;
 * `'quoted'` allows for `\` escapes, including escaped newlines
 */
export type FoldMode = 'flow' | 'block' | 'quoted'

export interface FoldOptions {
  /**
   * Accounts for leading contents on the first line, defaulting to
   * `indent.length`
   */
  indentAtStart?: number

  /** Default: `80` */
  lineWidth?: number

  /**
   * Allow highly indented lines to stretch the line width or indent content
   * from the start.
   *
   * Default: `20`
   */
  minContentWidth?: number

  /** Called once if the text is folded */
  onFold?: () => void

  /** Called once if any line of text exceeds lineWidth characters */
  onOverflow?: () => void
}

/**
 * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
 * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
 * terminated with `\n` and started with `indent`.
 */
export function foldFlowLines(
  text: string,
  indent: string,
  mode: FoldMode = 'flow',
  {
    indentAtStart,
    lineWidth = 80,
    minContentWidth = 20,
    onFold,
    onOverflow
  }: FoldOptions = {}
) {
  if (!lineWidth || lineWidth < 0) return text
  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length)
  if (text.length <= endStep) return text
  const folds = []
  const escapedFolds: Record<number, boolean> = {}
  let end = lineWidth - indent.length
  if (typeof indentAtStart === 'number') {
    if (indentAtStart > lineWidth - Math.max(2, minContentWidth)) folds.push(0)
    else end = lineWidth - indentAtStart
  }
  let split = undefined
  let prev = undefined
  let overflow = false
  let i = -1
  let escStart = -1
  let escEnd = -1
  if (mode === FOLD_BLOCK) {
    i = consumeMoreIndentedLines(text, i)
    if (i !== -1) end = i + endStep
  }
  for (let ch; (ch = text[(i += 1)]); ) {
    if (mode === FOLD_QUOTED && ch === '\\') {
      escStart = i
      switch (text[i + 1]) {
        case 'x':
          i += 3
          break
        case 'u':
          i += 5
          break
        case 'U':
          i += 9
          break
        default:
          i += 1
      }
      escEnd = i
    }
    if (ch === '\n') {
      if (mode === FOLD_BLOCK) i = consumeMoreIndentedLines(text, i)
      end = i + endStep
      split = undefined
    } else {
      if (
        ch === ' ' &&
        prev &&
        prev !== ' ' &&
        prev !== '\n' &&
        prev !== '\t'
      ) {
        // space surrounded by non-space can be replaced with newline + indent
        const next = text[i + 1]
        if (next && next !== ' ' && next !== '\n' && next !== '\t') split = i
      }
      if (i >= end) {
        if (split) {
          folds.push(split)
          end = split + endStep
          split = undefined
        } else if (mode === FOLD_QUOTED) {
          // white-space collected at end may stretch past lineWidth
          while (prev === ' ' || prev === '\t') {
            prev = ch
            ch = text[(i += 1)]
            overflow = true
          }
          // Account for newline escape, but don't break preceding escape
          const j = i > escEnd + 1 ? i - 2 : escStart - 1
          // Bail out if lineWidth & minContentWidth are shorter than an escape string
          if (escapedFolds[j]) return text
          folds.push(j)
          escapedFolds[j] = true
          end = j + endStep
          split = undefined
        } else {
          overflow = true
        }
      }
    }
    prev = ch
  }
  if (overflow && onOverflow) onOverflow()
  if (folds.length === 0) return text
  if (onFold) onFold()
  let res = text.slice(0, folds[0])
  for (let i = 0; i < folds.length; ++i) {
    const fold = folds[i]
    const end = folds[i + 1] || text.length
    if (fold === 0) res = `\n${indent}${text.slice(0, end)}`
    else {
      if (mode === FOLD_QUOTED && escapedFolds[fold]) res += `${text[fold]}\\`
      res += `\n${indent}${text.slice(fold + 1, end)}`
    }
  }
  return res
}

/**
 * Presumes `i + 1` is at the start of a line
 * @returns index of last newline in more-indented block
 */
function consumeMoreIndentedLines(text: string, i: number) {
  let ch = text[i + 1]
  while (ch === ' ' || ch === '\t') {
    do {
      ch = text[(i += 1)]
    } while (ch && ch !== '\n')
    ch = text[i + 1]
  }
  return i
}
