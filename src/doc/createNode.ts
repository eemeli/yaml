import type { Alias } from '../ast/Alias.js'
import { Node } from '../ast/Node.js'
import { Scalar } from '../ast/Scalar.js'
import type { YAMLMap } from '../ast/YAMLMap.js'
import type { YAMLSeq } from '../ast/YAMLSeq.js'
import { defaultTagPrefix } from '../constants.js'
import type { Tag } from '../tags/types.js'
import type { Replacer } from './Document.js'
import type { Schema } from './Schema.js'

export interface CreateNodeAliasRef {
  node: Scalar | YAMLMap | YAMLSeq | undefined
  value: unknown
}

export interface CreateNodeContext {
  keepUndefined?: boolean
  onAlias(source: CreateNodeAliasRef): Alias
  onTagObj?: (tagObj: Tag) => void
  prevObjects: Map<unknown, CreateNodeAliasRef>
  replacer?: Replacer
  schema: Schema
}

function findTagObject(
  value: unknown,
  tagName: string | undefined,
  tags: Tag[]
) {
  if (tagName) {
    const match = tags.filter(t => t.tag === tagName)
    const tagObj = match.find(t => !t.format) || match[0]
    if (!tagObj) throw new Error(`Tag ${tagName} not found`)
    return tagObj
  }
  return tags.find(t => t.identify && t.identify(value) && !t.format)
}

export function createNode(
  value: unknown,
  tagName: string | undefined,
  ctx: CreateNodeContext
): Node {
  if (value instanceof Node) return value
  const { onAlias, onTagObj, prevObjects } = ctx
  const { map, seq, tags } = ctx.schema
  if (tagName && tagName.startsWith('!!'))
    tagName = defaultTagPrefix + tagName.slice(2)

  let tagObj = findTagObject(value, tagName, tags)
  if (!tagObj) {
    if (value && typeof (value as any).toJSON === 'function')
      value = (value as any).toJSON()
    if (!value || typeof value !== 'object') return new Scalar(value)
    tagObj =
      value instanceof Map ? map : Symbol.iterator in Object(value) ? seq : map
  }
  if (onTagObj) {
    onTagObj(tagObj)
    delete ctx.onTagObj
  }

  // Detect duplicate references to the same object & use Alias nodes for all
  // after first. The `ref` wrapper allows for circular references to resolve.
  const ref: CreateNodeAliasRef = { value: undefined, node: undefined }
  if (value && typeof value === 'object') {
    const prev = prevObjects.get(value)
    if (prev) return onAlias(prev)
    ref.value = value
    prevObjects.set(value, ref)
  }

  const node = tagObj.createNode
    ? tagObj.createNode(ctx.schema, value, ctx)
    : new Scalar(value)
  if (tagName) node.tag = tagName
  ref.node = node

  return node
}
