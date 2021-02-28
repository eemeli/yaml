import type { Document } from '../doc/Document.js'
import { isAlias, isNode, isPair, isScalar, Node } from '../nodes/Node.js'
import type { Scalar } from '../nodes/Scalar.js'
import type { ToStringOptions } from '../options.js'
import type { TagObj } from '../tags/types.js'
import { stringifyString } from './stringifyString.js'

export type StringifyContext = Required<Omit<ToStringOptions, 'indent'>> & {
  anchors: Record<string, Node>
  doc: Document
  forceBlockIndent?: boolean
  implicitKey?: boolean
  indent: string
  indentStep: string
  indentAtStart?: number
  inFlow?: boolean
  stringify: typeof stringify
  [key: string]: unknown
}

function getTagObject(tags: TagObj[], item: Node) {
  if (item.tag) {
    const match = tags.filter(t => t.tag === item.tag)
    if (match.length > 0)
      return match.find(t => t.format === (item as Scalar).format) || match[0]
  }

  let tagObj: TagObj | undefined = undefined
  let obj: unknown
  if (isScalar(item)) {
    obj = item.value
    const match = tags.filter(t => t.identify && t.identify(obj))
    tagObj =
      match.find(t => t.format === item.format) || match.find(t => !t.format)
  } else {
    obj = item
    tagObj = tags.find(t => t.nodeClass && obj instanceof t.nodeClass)
  }

  if (!tagObj) {
    // @ts-ignore
    const name = obj && obj.constructor ? obj.constructor.name : typeof obj
    throw new Error(`Tag not resolved for ${name} value`)
  }
  return tagObj
}

// needs to be called before value stringifier to allow for circular anchor refs
function stringifyProps(
  node: Node,
  tagObj: TagObj,
  { anchors, doc }: StringifyContext
) {
  const props = []
  const anchor = doc.anchors.getName(node)
  if (anchor) {
    anchors[anchor] = node
    props.push(`&${anchor}`)
  }
  if (node.tag) {
    props.push(doc.directives.tagString(node.tag))
  } else if (!tagObj.default) {
    props.push(doc.directives.tagString(tagObj.tag))
  }
  return props.join(' ')
}

export function stringify(
  item: unknown,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string {
  if (isPair(item)) return item.toString(ctx, onComment, onChompKeep)
  if (isAlias(item)) return item.toString(ctx)

  let tagObj: TagObj | undefined = undefined
  const node = isNode(item)
    ? item
    : ctx.doc.createNode(item, { onTagObj: o => (tagObj = o) })

  if (!tagObj) tagObj = getTagObject(ctx.doc.schema.tags, node)

  const props = stringifyProps(node, tagObj, ctx)
  if (props.length > 0)
    ctx.indentAtStart = (ctx.indentAtStart || 0) + props.length + 1

  const str =
    typeof tagObj.stringify === 'function'
      ? tagObj.stringify(node as Scalar, ctx, onComment, onChompKeep)
      : isScalar(node)
      ? stringifyString(node, ctx, onComment, onChompKeep)
      : node.toString(ctx, onComment, onChompKeep)
  if (!props) return str
  return isScalar(node) || str[0] === '{' || str[0] === '['
    ? `${props} ${str}`
    : `${props}\n${ctx.indent}${str}`
}
