import { YAMLSeq } from '../../ast/YAMLSeq.js'
import { createNode } from '../../doc/createNode.js'

function createSeq(schema, obj, ctx) {
  const { replacer } = ctx
  const seq = new YAMLSeq(schema)
  if (obj && obj[Symbol.iterator]) {
    let i = 0
    for (let it of obj) {
      if (typeof replacer === 'function') {
        const key = obj instanceof Set ? it : String(i++)
        it = replacer.call(obj, key, it)
      }
      seq.items.push(createNode(it, null, ctx))
    }
  }
  return seq
}

export const seq = {
  createNode: createSeq,
  default: true,
  nodeClass: YAMLSeq,
  tag: 'tag:yaml.org,2002:seq',
  resolve(seq, onError) {
    if (!(seq instanceof YAMLSeq)) onError('Expected a sequence for this tag')
    return seq
  }
}
