import { anchorIsValid } from '../doc/anchors.ts'
import type { Document } from '../doc/Document.ts'
import { Alias } from '../nodes/Alias.ts'
import type { Node } from '../nodes/Node.ts'
import { Pair } from '../nodes/Pair.ts'
import { Scalar } from '../nodes/Scalar.ts'
import type { ToStringOptions } from '../options.ts'
import type { CollectionTag, ScalarTag } from '../schema/types.ts'
import { stringifyComment } from './stringifyComment.ts'
import { stringifyString } from './stringifyString.ts'

export type StringifyContext = {
  actualString?: boolean
  anchors: Set<string>
  doc: Document
  forceBlockIndent?: boolean
  implicitKey?: boolean
  indent: string
  indentStep: string
  indentAtStart?: number
  inFlow: boolean | null
  inStringifyKey?: boolean
  flowCollectionPadding: string
  noValues?: boolean
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
  if (item instanceof Scalar) {
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
    const name =
      (obj as any)?.constructor?.name ?? (obj === null ? 'null' : typeof obj)
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
  const anchor = node.anchor
  if (anchor && anchorIsValid(anchor)) {
    anchors.add(anchor)
    props.push(`&${anchor}`)
  }
  const tag = node.tag ?? (tagObj.default ? null : tagObj.tag)
  if (tag) props.push(doc.directives.tagString(tag))
  return props.join(' ')
}

export function stringify(
  node: Node | Pair | null,
  ctx: StringifyContext,
  onComment?: () => void,
  onChompKeep?: () => void
): string {
  if (node instanceof Pair) return node.toString(ctx, onComment, onChompKeep)
  if (node instanceof Alias) {
    if (ctx.doc.directives) return node.toString(ctx)
    if (ctx.resolvedAliases?.has(node)) {
      const msg = 'Cannot stringify circular structure without alias nodes'
      throw new TypeError(msg)
    }

    if (ctx.resolvedAliases) ctx.resolvedAliases.add(node)
    else ctx.resolvedAliases = new Set([node])
    node = node.resolve(ctx.doc) ?? null
  }

  let tagObj: ScalarTag | CollectionTag | undefined = undefined
  node ??= ctx.doc.createNode(null, { onTagObj: o => (tagObj = o) })
  tagObj ??= getTagObject(ctx.doc.schema.tags, node)

  const props = stringifyProps(node, tagObj, ctx)
  if (props.length > 0)
    ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1

  const str =
    typeof tagObj.stringify === 'function'
      ? tagObj.stringify(node as Scalar, ctx, onComment, onChompKeep)
      : node instanceof Scalar
        ? stringifyString(node, ctx, onComment, onChompKeep)
        : node.toString(ctx, onComment, onChompKeep)
  if (!props) return str
  return node instanceof Scalar || str[0] === '{' || str[0] === '['
    ? `${props} ${str}`
    : `${props}\n${ctx.indent}${str}`
}
