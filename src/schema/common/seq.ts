import type { NodeCreator } from '../../doc/NodeCreator.ts'
import type { Collection } from '../../nodes/Collection.ts'
import { YAMLSeq } from '../../nodes/YAMLSeq.ts'
import type { CollectionTag } from '../types.ts'

export const seq: {
  collection: 'seq'
  default: true
  nodeClass: typeof YAMLSeq
  tag: string
  createNode(nc: NodeCreator, obj: unknown): YAMLSeq
  resolve(seq: Collection, onError: (message: string) => void): YAMLSeq
} = {
  collection: 'seq',
  default: true,
  nodeClass: YAMLSeq,
  tag: 'tag:yaml.org,2002:seq',

  createNode(nc, obj): YAMLSeq {
    return YAMLSeq.create(nc, obj)
  },

  resolve(seq, onError): YAMLSeq {
    if (!(seq instanceof YAMLSeq)) onError('Expected a sequence for this tag')
    return seq as YAMLSeq
  }
} satisfies CollectionTag
