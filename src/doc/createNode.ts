import { Alias } from '../ast/index.js'
import { Node } from '../ast/Node.js'
import { Scalar } from '../ast/Scalar.js'
import { defaultTagPrefix } from '../constants.js'
import type { Replacer } from './Document.js'
import type { Schema } from './Schema.js'

export interface CreateNodeAliasRef {
  node: unknown
  value: unknown
}

export interface CreateNodeContext {
  keepUndefined?: boolean
  onAlias(source: CreateNodeAliasRef): Alias
  onTagObj?: (tagObj: Schema.Tag) => void
  prevObjects: Map<unknown, CreateNodeAliasRef>
  replacer?: Replacer
  schema: Schema
  wrapScalars: boolean
}

function findTagObject(
  value: unknown,
  tagName: string | null,
  tags: Schema.Tag[]
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
  tagName: string | null,
  ctx: CreateNodeContext
) {
  if (value instanceof Node) return value
  const { onAlias, onTagObj, prevObjects, wrapScalars } = ctx
  const { map, seq, tags } = ctx.schema
  if (tagName && tagName.startsWith('!!'))
    tagName = defaultTagPrefix + tagName.slice(2)

  let tagObj = findTagObject(value, tagName, tags)
  if (!tagObj) {
    if (value && typeof (value as any).toJSON === 'function')
      value = (value as any).toJSON()
    if (!value || typeof value !== 'object')
      return wrapScalars ? new Scalar(value) : value
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

  ref.node = tagObj.createNode
    ? tagObj.createNode(ctx.schema, value, ctx)
    : wrapScalars
    ? new Scalar(value)
    : value
  if (tagName && ref.node instanceof Node) ref.node.tag = tagName

  return ref.node
}
