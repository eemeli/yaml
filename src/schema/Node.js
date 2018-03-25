export const addComment = (str, indent, comment) => (
  !comment ? str
    : comment.indexOf('\n') === -1 ? `${str} #${comment}`
    : `${str}\n` + comment.replace(/^/gm, `${indent || ''}#`)
)

export default class Node {
  anchor = null
  comment = null
  commentBefore = null
  tag = null
}
