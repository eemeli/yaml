import { YAMLSeq } from '../../ast/YAMLSeq.js'
import { resolveSeq } from '../../resolve/resolveSeq.js'

function createSeq(schema, obj, ctx) {
  const seq = new YAMLSeq(schema)
  if (obj && obj[Symbol.iterator]) {
    for (const it of obj) {
      const v = schema.createNode(it, null, null, ctx)
      seq.items.push(v)
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
