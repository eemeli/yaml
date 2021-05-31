export const stringifyComment = (comment: string, indent: string) =>
  /^\n+$/.test(comment)
    ? comment.substring(1)
    : comment.replace(/^(?!$)(?: $)?/gm, `${indent}#`)

export function addComment(
  str: string,
  indent: string,
  comment?: string | null
) {
  return !comment
    ? str
    : comment.includes('\n')
    ? `${str}\n` + stringifyComment(comment, indent)
    : str.endsWith(' ')
    ? `${str}#${comment}`
    : `${str} #${comment}`
}
