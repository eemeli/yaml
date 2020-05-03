import { YAMLSeq } from '../../ast/YAMLSeq'
import { parseSeq } from '../../ast/parseSeq'

function createSeq(schema, obj, ctx) {
  const seq = new YAMLSeq(schema)
  if (obj && obj[Symbol.iterator]) {
    for (const it of obj) {
      const v = schema.createNode(it, ctx.wrapScalars, null, ctx)
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
  resolve: parseSeq
}
