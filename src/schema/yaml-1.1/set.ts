import type { NodeCreator } from '../../doc/NodeCreator.ts'
import { YAMLSet } from '../../nodes/YAMLSet.ts'
import type { CollectionTag } from '../types.ts'

export const set: CollectionTag = {
  collection: 'map',
  identify: value => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: 'tag:yaml.org,2002:set',

  createNode(nc: NodeCreator, iterable: unknown): YAMLSet<any> {
    const set = new YAMLSet<any>(nc.schema)
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable as Iterable<unknown>) {
        if (typeof nc.replacer === 'function')
          value = nc.replacer.call(iterable, value, value)
        set.add(nc.create(value))
      }
    return set
  },

  resolve(set, onError) {
    if (!(set instanceof YAMLSet)) {
      onError('Expected a set for this tag')
    }
    return set
  }
}
