export const stringifyComment = (comment: string, indent: string) =>
  comment.replace(/^(?!$)(?: $)?/gm, `${indent}#`)

export function addCommentBefore(
  str: string,
  indent: string,
  comment?: string | null
) {
  if (!comment) return str
  const cc = comment.replace(/([\s\S])^(?!$)(?: $)?/gm, `$1${indent}#`)
  return `#${cc}\n${indent}${str}`
}

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
