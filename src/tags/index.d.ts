import { SchemaId, Tag, TagId } from './types.js'

export const schemas: Record<SchemaId, Tag[]>
export const tags: Record<TagId | 'map' | 'seq', Tag>
