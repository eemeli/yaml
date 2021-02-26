import { TagId, TagObj } from './types.js'

import { failsafe } from './failsafe/index.js'
import { json } from './json.js'

export const schemas: {
  core: TagObj[]
  failsafe: typeof failsafe
  json: typeof json
  yaml11: TagObj[]
}

//export const schemas: Record<SchemaId, Tag[]>
export const tags: Record<TagId | 'map' | 'seq', TagObj>
