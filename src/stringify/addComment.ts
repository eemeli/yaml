export function addCommentBefore(
  str: string,
  indent: string,
  comment?: string
) {
  if (!comment) return str
  const cc = comment.replace(/[\s\S]^/gm, `$&${indent}#`)
  return `#${cc}\n${indent}${str}`
}

export function addComment(str: string, indent: string, comment?: string) {
  return !comment
    ? str
    : comment.includes('\n')
    ? `${str}\n` + comment.replace(/^/gm, `${indent || ''}#`)
    : str.endsWith(' ')
    ? `${str}#${comment}`
    : `${str} #${comment}`
}
