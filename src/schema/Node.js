export const addFlowComment = (str, indent, comment) => {
  if (!comment) return str
  const cc = comment.replace(/\n/g, `\n${indent}#`)
  return str.indexOf('\n') === -1 ? `${str} #${cc}` : `#${cc}\n${indent}${str}`
}

export default class Node {
  anchor = null
  comment = null
  commentBefore = null
  tag = null
}
