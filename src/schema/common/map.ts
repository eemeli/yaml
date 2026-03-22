import type { NodeCreator } from '../../doc/NodeCreator.ts'
import type { Collection } from '../../nodes/Collection.ts'
import { YAMLMap } from '../../nodes/YAMLMap.ts'
import type { CollectionTag } from '../types.ts'

export const map: {
  collection: 'map'
  default: true
  nodeClass: typeof YAMLMap
  tag: string
  createNode(nc: NodeCreator, obj: unknown): YAMLMap<any, any>
  resolve(
    map: Collection,
    onError: (message: string) => void
  ): YAMLMap<any, any>
} = {
  collection: 'map',
  default: true,
  nodeClass: YAMLMap,
  tag: 'tag:yaml.org,2002:map',

  createNode(nc, obj): YAMLMap<any, any> {
    return YAMLMap.create(nc, obj)
  },

  resolve(map, onError) {
    if (!(map instanceof YAMLMap)) onError('Expected a mapping for this tag')
    return map as YAMLMap<any, any>
  }
} satisfies CollectionTag
