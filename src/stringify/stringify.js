import { Alias } from '../ast/Alias.js'
import { Node } from '../ast/Node.js'
import { Pair } from '../ast/Pair.js'
import { Scalar } from '../ast/Scalar.js'
import { stringifyString } from './stringifyString.js'
import { stringifyTag } from './stringifyTag.js'

function getTagObject(tags, item) {
  if (item instanceof Alias) return Alias
  if (item.tag) {
    const match = tags.filter(t => t.tag === item.tag)
    if (match.length > 0)
      return match.find(t => t.format === item.format) || match[0]
  }

  let tagObj, obj
  if (item instanceof Scalar) {
    obj = item.value
    // TODO: deprecate/remove class check
    const match = tags.filter(
      t =>
        (t.identify && t.identify(obj)) || (t.class && obj instanceof t.class)
    )
    tagObj =
      match.find(t => t.format === item.format) || match.find(t => !t.format)
  } else {
    obj = item
    tagObj = tags.find(t => t.nodeClass && obj instanceof t.nodeClass)
  }

  if (!tagObj) {
    const name = obj && obj.constructor ? obj.constructor.name : typeof obj
    throw new Error(`Tag not resolved for ${name} value`)
  }
  return tagObj
}

// needs to be called before value stringifier to allow for circular anchor refs
function stringifyProps(node, tagObj, { anchors, doc }) {
  const props = []
  const anchor = doc.anchors.getName(node)
  if (anchor) {
    anchors[anchor] = node
    props.push(`&${anchor}`)
  }
  if (node.tag) {
    props.push(stringifyTag(doc, node.tag))
  } else if (!tagObj.default) {
    props.push(stringifyTag(doc, tagObj.tag))
  }
  return props.join(' ')
}

export function stringify(item, ctx, onComment, onChompKeep) {
  const { anchors, schema } = ctx.doc

  let tagObj
  if (!(item instanceof Node)) {
    const createCtx = {
      aliasNodes: [],
      onTagObj: o => (tagObj = o),
      prevObjects: new Map()
    }
    item = schema.createNode(item, true, null, createCtx)
    for (const alias of createCtx.aliasNodes) {
      alias.source = alias.source.node
      let name = anchors.getName(alias.source)
      if (!name) {
        name = anchors.newName()
        anchors.map[name] = alias.source
      }
    }
  }

  if (item instanceof Pair) return item.toString(ctx, onComment, onChompKeep)
  if (!tagObj) tagObj = getTagObject(schema.tags, item)

  const props = stringifyProps(item, tagObj, ctx)
  if (props.length > 0)
    ctx.indentAtStart = (ctx.indentAtStart || 0) + props.length + 1

  const str =
    typeof tagObj.stringify === 'function'
      ? tagObj.stringify(item, ctx, onComment, onChompKeep)
      : item instanceof Scalar
      ? stringifyString(item, ctx, onComment, onChompKeep)
      : item.toString(ctx, onComment, onChompKeep)
  if (!props) return str
  return item instanceof Scalar || str[0] === '{' || str[0] === '['
    ? `${props} ${str}`
    : `${props}\n${ctx.indent}${str}`
}
