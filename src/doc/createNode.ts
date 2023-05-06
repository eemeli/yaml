import { Alias } from '../nodes/Alias.js'
import { isDocument, isNode, isPair, MAP, SEQ } from '../nodes/identity.js'
import type { Node } from '../nodes/Node.js'
import { Scalar } from '../nodes/Scalar.js'
import type { YAMLMap } from '../nodes/YAMLMap.js'
import type { Schema } from '../schema/Schema.js'
import type { CollectionTag, ScalarTag } from '../schema/types.js'
import type { Replacer } from './Document.js'

const defaultTagPrefix = 'tag:yaml.org,2002:'

export interface CreateNodeContext {
  aliasDuplicateObjects: boolean
  keepUndefined: boolean
  onAnchor: (source: unknown) => string
  onTagObj?: (tagObj: ScalarTag | CollectionTag) => void
  sourceObjects: Map<unknown, { anchor: string | null; node: Node | null }>
  replacer?: Replacer
  schema: Schema
}

function findTagObject(
  value: unknown,
  tagName: string | undefined,
  tags: Array<ScalarTag | CollectionTag>
) {
  if (tagName) {
    const match = tags.filter(t => t.tag === tagName)
    const tagObj = match.find(t => !t.format) ?? match[0]
    if (!tagObj) throw new Error(`Tag ${tagName} not found`)
    return tagObj
  }
  return tags.find(t => t.identify?.(value) && !t.format)
}

export function createNode(
  value: unknown,
  tagName: string | undefined,
  ctx: CreateNodeContext
): Node {
  if (isDocument(value)) value = value.contents
  if (isNode(value)) return value
  if (isPair(value)) {
    const map = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx) as YAMLMap
    map.items.push(value)
    return map
  }
  if (
    value instanceof String ||
    value instanceof Number ||
    value instanceof Boolean ||
    (typeof BigInt !== 'undefined' && value instanceof BigInt) // not supported everywhere
  ) {
    // https://tc39.es/ecma262/#sec-serializejsonproperty
    value = value.valueOf()
  }

  const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } =
    ctx

  // Detect duplicate references to the same object & use Alias nodes for all
  // after first. The `ref` wrapper allows for circular references to resolve.
  let ref: { anchor: string | null; node: Node | null } | undefined = undefined
  if (aliasDuplicateObjects && value && typeof value === 'object') {
    ref = sourceObjects.get(value)
    if (ref) {
      if (!ref.anchor) ref.anchor = onAnchor(value)
      return new Alias(ref.anchor)
    } else {
      ref = { anchor: null, node: null }
      sourceObjects.set(value, ref)
    }
  }

  if (tagName?.startsWith('!!')) tagName = defaultTagPrefix + tagName.slice(2)

  let tagObj = findTagObject(value, tagName, schema.tags)
  if (!tagObj) {
    if (value && typeof (value as any).toJSON === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      value = (value as any).toJSON()
    }
    if (!value || typeof value !== 'object') {
      const node = new Scalar(value)
      if (ref) ref.node = node
      return node
    }
    tagObj =
      value instanceof Map
        ? schema[MAP]
        : Symbol.iterator in Object(value)
        ? schema[SEQ]
        : schema[MAP]
  }
  if (onTagObj) {
    onTagObj(tagObj)
    delete ctx.onTagObj
  }

  const node = tagObj?.createNode
    ? tagObj.createNode(ctx.schema, value, ctx)
    : typeof tagObj?.nodeClass?.from === 'function'
    ? tagObj.nodeClass.from(ctx.schema, value, ctx)
    : new Scalar(value)
  if (tagName) node.tag = tagName
  else if (!tagObj.default) node.tag = tagObj.tag

  if (ref) ref.node = node
  return node
}
