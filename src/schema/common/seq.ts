import { isSeq } from '../../nodes/identity.ts'
import { YAMLSeq } from '../../nodes/YAMLSeq.ts'
import type { CollectionTag } from '../types.ts'

export const seq: CollectionTag = {
  collection: 'seq',
  default: true,
  nodeClass: YAMLSeq,
  tag: 'tag:yaml.org,2002:seq',
  resolve(seq, onError) {
    if (!isSeq(seq)) onError('Expected a sequence for this tag')
    return seq
  },
  createNode: (nc, obj) => YAMLSeq.from(nc, obj)
}
