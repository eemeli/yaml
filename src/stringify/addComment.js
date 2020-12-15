export function addCommentBefore(str, indent, comment) {
  if (!comment) return str
  const cc = comment.replace(/[\s\S]^/gm, `$&${indent}#`)
  return `#${cc}\n${indent}${str}`
}

export function addComment(str, indent, comment) {
  return !comment
    ? str
    : comment.includes('\n')
    ? `${str}\n` + comment.replace(/^/gm, `${indent || ''}#`)
    : str.endsWith(' ')
    ? `${str}#${comment}`
    : `${str} #${comment}`
}
