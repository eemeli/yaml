import { YAMLSeq } from '../../ast/YAMLSeq.js'
import { createNode } from '../../doc/createNode.js'
import { resolveSeq } from '../../resolve/resolveSeq.js'

function createSeq(schema, obj, ctx) {
  const { replacer } = ctx
  const seq = new YAMLSeq(schema)
  if (obj && obj[Symbol.iterator]) {
    let i = 0
    for (let it of obj) {
      if (typeof replacer === 'function')
        it = replacer.call(obj, String(i++), it)
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
  resolve: resolveSeq
}
