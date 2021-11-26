import { anchorIsValid } from '../doc/anchors.js'
import type { Document } from '../doc/Document.js'
import {
  isAlias,
  isCollection,
  isNode,
  isPair,
  isScalar,
  Node
} from '../nodes/Node.js'
import type { Scalar } from '../nodes/Scalar.js'
import type { ToStringOptions } from '../options.js'
import type { CollectionTag, ScalarTag } from '../schema/types.js'
import { stringifyComment } from './stringifyComment.js'
import { stringifyString } from './stringifyString.js'

export type StringifyContext = {
  actualString?: boolean
  allNullValues?: boolean
  anchors: Set<string>
  doc: Document
  forceBlockIndent?: boolean
  implicitKey?: boolean
  indent: string
  indentStep: string
  indentAtStart?: number
  inFlow?: boolean
  inStringifyKey?: boolean
  options: Readonly<Required<Omit<ToStringOptions, 'indent'>>>
}

export function createStringifyContext(
  doc: Document,
  options: ToStringOptions
): StringifyContext {
  const opt = Object.assign(
    {
      blockQuote: true,
      commentString: stringifyComment,
      defaultKeyType: null,
      defaultStringType: 'PLAIN',
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: 'false',
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: 'null',
      simpleKeys: false,
      singleQuote: null,
      trueStr: 'true',
      verifyAliasOrder: true
    },
    doc.schema.toStringOptions,
    options
  )

  return {
    anchors: new Set(),
    doc,
    indent: '',
    indentStep: typeof opt.indent === 'number' ? ' '.repeat(opt.indent) : '  ',
    options: opt
  }
}

function getTagObject(tags: Array<ScalarTag | CollectionTag>, item: Node) {
  if (item.tag) {
    const match = tags.filter(t => t.tag === item.tag)
    if (match.length > 0)
      return match.find(t => t.format === (item as Scalar).format) || match[0]
  }

  let tagObj: ScalarTag | CollectionTag | undefined = undefined
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
  tagObj: ScalarTag | CollectionTag,
  { anchors, doc }: StringifyContext
) {
  const props = []
  const anchor = (isScalar(node) || isCollection(node)) && node.anchor
  if (anchor && anchorIsValid(anchor)) {
    anchors.add(anchor)
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

  let tagObj: ScalarTag | CollectionTag | undefined = undefined
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
