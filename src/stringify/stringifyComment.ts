/**
 * Stringifies a comment.
 *
 * Empty comment lines are left empty,
 * lines consisting of a single space are replaced by `#`,
 * and all other lines are prefixed with a `#`.
 */
export const stringifyComment = (str: string) =>
  str.replace(/^(?!$)(?: $)?/gm, '#')

export function indentComment(comment: string, indent: string) {
  if (/^\n+$/.test(comment)) return comment.substring(1)
  return indent ? comment.replace(/^(?! *$)/gm, indent) : comment
}

export const lineComment = (
  str: string, 
  indent: string, 
  comment: string,
  inlineIndentBeforeComment: number,
) =>
  str.endsWith('\n')
    ? indentComment(comment, indent)
    : comment.includes('\n')
      ? '\n' + indentComment(comment, indent)
      : (' '.repeat(inlineIndentBeforeComment - (str.endsWith(' ') ? 1 : 0))) + comment
