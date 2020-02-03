import parseSeq from '../../schema/parseSeq'
import YAMLSeq from '../../schema/Seq'

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

export default {
  createNode: createSeq,
  default: true,
  nodeClass: YAMLSeq,
  tag: 'tag:yaml.org,2002:seq',
  resolve: parseSeq
}
