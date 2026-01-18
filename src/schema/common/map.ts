import { isMap } from '../../nodes/identity.ts'
import { YAMLMap } from '../../nodes/YAMLMap.ts'
import type { CollectionTag } from '../types.ts'

export const map: CollectionTag = {
  collection: 'map',
  default: true,
  nodeClass: YAMLMap,
  tag: 'tag:yaml.org,2002:map',
  resolve(map, onError) {
    if (!isMap(map)) onError('Expected a mapping for this tag')
    return map
  },
  createNode: (nc, obj) => YAMLMap.from(nc, obj)
}
