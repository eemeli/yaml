import type { NodeCreator } from '../../doc/NodeCreator.ts'
import type { Node } from '../../nodes/Node.ts'
import type { Pair } from '../../nodes/Pair.ts'
import { Scalar } from '../../nodes/Scalar.ts'
import { YAMLSet } from '../../nodes/YAMLSet.ts'
import type { CollectionTag } from '../types.ts'

const hasAllNullValues = (set: YAMLSet): boolean =>
  set.every(
    ({ value }) =>
      value == null ||
      (value instanceof Scalar &&
        value.value == null &&
        !value.commentBefore &&
        !value.comment &&
        !value.tag)
  )

export const set: CollectionTag = {
  collection: 'map',
  identify: value => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: 'tag:yaml.org,2002:set',

  createNode(nc: NodeCreator, iterable: unknown): YAMLSet {
    const set = new YAMLSet(nc.schema)
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable as Iterable<unknown>) {
        if (typeof nc.replacer === 'function')
          value = nc.replacer.call(iterable, value, value)
        set.push(nc.createPair(value, null) as Pair<Node, null>)
      }
    return set
  },

  resolve(set, onError) {
    if (!(set instanceof YAMLSet)) {
      onError('Expected a set for this tag')
    } else if (!hasAllNullValues(set)) {
      onError('Set items must all have null values')
    }
    return set
  }
}
