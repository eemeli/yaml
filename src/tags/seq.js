import { Type } from 'raw-yaml'
import { YAMLSyntaxError } from '../errors'

export default function resolveSeq (doc, node) {
  const seq = node.resolved = []
  const comments = []
  seq.comments = () => comments
  seq.toString = () => JSON.stringify(seq)
  for (let i = 0; i < node.items.length; ++i) {
    const item = node.items[i]
    switch (item.type) {
      case Type.COMMENT:
        comments.push({ before: seq.length, comment: item.comment })
        break
      case Type.SEQ_ITEM:
        seq.push(doc.resolveNode(item.node))
        break
      default:
        doc.errors.push(new YAMLSyntaxError(item, `Unexpected ${item.type} node in sequence`))
    }
  }
  // TODO: include seq & item comments
  return seq
}
