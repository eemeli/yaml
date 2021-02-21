import { SchemaId, Tag, TagId } from './types'

export const schemas: Record<SchemaId, Tag[]>
export const tags: Record<TagId | 'map' | 'seq', Tag>
