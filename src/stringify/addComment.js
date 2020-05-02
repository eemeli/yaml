export function addCommentBefore(str, indent, comment) {
  if (!comment) return str
  const cc = comment.replace(/[\s\S]^/gm, `$&${indent}#`)
  return `#${cc}\n${indent}${str}`
}

export function addComment(str, indent, comment) {
  return !comment
    ? str
    : comment.indexOf('\n') === -1
    ? `${str} #${comment}`
    : `${str}\n` + comment.replace(/^/gm, `${indent || ''}#`)
}
