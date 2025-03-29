import { anchorIsValid } from '../doc/anchors.ts'
import type { Document } from '../doc/Document.ts'
import type { Alias } from '../nodes/Alias.ts'
import {
  isAlias,
  isCollection,
  isNode,
  isPair,
  isScalar
} from '../nodes/identity.ts'
import type { Node } from '../nodes/Node.ts'
import type { Scalar } from '../nodes/Scalar.ts'
import type { ToStringOptions } from '../options.ts'
import type { CollectionTag, ScalarTag } from '../schema/types.ts'
import { stringifyComment } from './stringifyComment.ts'
import { stringifyString } from './stringifyString.ts'

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
  inFlow: boolean | null
  inlineIndentBeforeComment?: number,
  inStringifyKey?: boolean
  flowCollectionPadding: string
  options: Readonly<
    Required<Omit<ToStringOptions, 'collectionStyle' | 'indent'>>
  >
  resolvedAliases?: Set<Alias>
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
      flowCollectionPadding: true,
      indentSeq: true,
      inlineIndentBeforeComment: 1,
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

  let inFlow: boolean | null
  switch (opt.collectionStyle) {
    case 'block':
      inFlow = false
      break
    case 'flow':
      inFlow = true
      break
    default:
      inFlow = null
  }

  return {
    anchors: new Set(),
    doc,
    flowCollectionPadding: opt.flowCollectionPadding ? ' ' : '',
    indent: '',
    indentStep: typeof opt.indent === 'number' ? ' '.repeat(opt.indent) : '  ',
    inFlow,
    options: opt
  }
}

function getTagObject(tags: Array<ScalarTag | CollectionTag>, item: Node) {
  if (item.tag) {
    const match = tags.filter(t => t.tag === item.tag)
    if (match.length > 0)
      return match.find(t => t.format === (item as Scalar).format) ?? match[0]
  }

  let tagObj: ScalarTag | CollectionTag | undefined = undefined
  let obj: unknown
  if (isScalar(item)) {
    obj = item.value
    let match = tags.filter(t => t.identify?.(obj))
    if (match.length > 1) {
      const testMatch = match.filter(t => t.test)
      if (testMatch.length > 0) match = testMatch
    }
    tagObj =
      match.find(t => t.format === item.format) ?? match.find(t => !t.format)
  } else {
    obj = item
    tagObj = tags.find(t => t.nodeClass && obj instanceof t.nodeClass)
  }

  if (!tagObj) {
    const name = (obj as any)?.constructor?.name ?? typeof obj
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
  if (!doc.directives) return ''
  const props = []
  const anchor = (isScalar(node) || isCollection(node)) && node.anchor
  if (anchor && anchorIsValid(anchor)) {
    anchors.add(anchor)
    props.push(`&${anchor}`)
  }
  const tag = node.tag ? node.tag : tagObj.default ? null : tagObj.tag
  if (tag) props.push(doc.directives.tagString(tag))
  return props.join(' ')
}

export function stringify(
  item: unknown,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string {
  if (isPair(item)) return item.toString(ctx, onComment, onChompKeep)
  if (isAlias(item)) {
    if (ctx.doc.directives) return item.toString(ctx)

    if (ctx.resolvedAliases?.has(item)) {
      throw new TypeError(
        `Cannot stringify circular structure without alias nodes`
      )
    } else {
      if (ctx.resolvedAliases) ctx.resolvedAliases.add(item)
      else ctx.resolvedAliases = new Set([item])
      item = item.resolve(ctx.doc)
    }
  }

  let tagObj: ScalarTag | CollectionTag | undefined = undefined
  const node = isNode(item)
    ? item
    : ctx.doc.createNode(item, { onTagObj: o => (tagObj = o) })

  if (!tagObj) tagObj = getTagObject(ctx.doc.schema.tags, node)

  const props = stringifyProps(node, tagObj, ctx)
  if (props.length > 0)
    ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1

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
