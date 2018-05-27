export const FOLD_FLOW = 'flow'
export const FOLD_BLOCK = 'block'
export const FOLD_QUOTED = 'quoted'

/**
 * Tries to keep input at up to `lineWidth` characters, splitting only on spaces
 * not followed by newlines or spaces unless `mode` is `'quoted'`. Lines are
 * terminated with `\n` and started with `indent`.
 *
 * @param {string} text
 * @param {string} indent
 * @param {string} [mode='flow'] `'block'` prevents more-indented lines
 *   from being folded; `'quoted'` allows for `\` escapes, including escaped
 *   newlines
 * @param {Object} options
 * @param {number} [options.indentAtStart] Accounts for leading contents on
 *   the first line, defaulting to `indent.length`
 * @param {number} [options.lineWidth=80]
 * @param {number} [options.minContentWidth=20] Allow highly indented lines to
 *   stretch the line width
 * @param {function} options.onFold Called once if the text is folded
 * @param {function} options.onFold Called once if any line of text exceeds
 *   lineWidth characters
 */
export default function foldFlowLines(
  text,
  indent,
  mode,
  { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow }
) {
  if (!lineWidth || lineWidth < 0) return text
  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length)
  if (text.length <= endStep) return text
  const folds = []
  const escapedFolds = {}
  let end =
    lineWidth -
    (typeof indentAtStart === 'number' ? indentAtStart : indent.length)
  let split = undefined
  let prev = undefined
  let overflow = false
  for (let i = 0, ch = text[0]; ch; ch = text[(i += 1)]) {
    if (mode === FOLD_QUOTED && ch === '\\') {
      switch (text[i + 1]) {
        case 'x':
          ch = text[(i += 4)]
          break
        case 'u':
          ch = text[(i += 6)]
          break
        case 'U':
          ch = text[(i += 10)]
          break
        default:
          ch = text[(i += 2)]
      }
    }
    if (ch === '\n') {
      if (mode === FOLD_BLOCK) {
        // more-indented lines in blocks can't be folded
        let next = text[i + 1]
        while (next === ' ' || next === '\t') {
          do {
            ch = text[(i += 1)]
          } while (ch && ch !== '\n')
          next = text[i + 1]
        }
      }
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
          // i - 2 accounts for not-dropped last char + newline-escaping \
          folds.push(i - 2)
          escapedFolds[i - 2] = true
          end = i - 2 + endStep
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
    if (mode === FOLD_QUOTED && escapedFolds[fold]) res += `${text[fold]}\\`
    res += `\n${indent}${text.slice(fold + 1, end)}`
  }
  return res
}
