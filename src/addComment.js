export default function addComment (str, indent, comment) {
  return !comment ? str
    : comment.indexOf('\n') === -1 ? `${str} #${comment}`
    : `${str}\n` + comment.replace(/^/gm, `${indent || ''}#`)
}
