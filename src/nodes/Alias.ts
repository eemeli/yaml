import { anchorIsValid } from '../doc/anchors.ts'
import type { Document, DocValue } from '../doc/Document.ts'
import type { FlowScalar } from '../parse/cst.ts'
import type { StringifyContext } from '../stringify/stringify.ts'
import { visit } from '../visit.ts'
import type { Node, NodeBase, Range } from './Node.ts'
import { Pair } from './Pair.ts'
import type { Scalar } from './Scalar.ts'
import { ToJSContext } from './toJS.ts'
import type { YAMLMap } from './YAMLMap.ts'
import type { YAMLSeq } from './YAMLSeq.ts'

export class Alias implements NodeBase {
  source: string

  declare anchor?: never

  /** A comment on or immediately after this node. */
  declare comment?: string | null

  /** A comment before this node. */
  declare commentBefore?: string | null

  /**
   * The `[start, value-end, node-end]` character offsets for
   * the part of the source parsed into this node (undefined if not parsed).
   * The `value-end` and `node-end` positions are themselves not included in their respective ranges.
   */
  declare range?: Range | null

  /** A blank line before this node and its commentBefore */
  declare spaceBefore?: boolean

  /** The CST token that was composed into this node.  */
  declare srcToken?: FlowScalar & { type: 'alias' }

  declare tag?: never

  constructor(source: string) {
    this.source = source
    Object.defineProperty(this, 'tag', {
      set() {
        throw new Error('Alias nodes cannot have tags')
      }
    })
  }

  /** Create a copy of this node.  */
  clone(): this {
    const copy: this = Object.create(
      Object.getPrototypeOf(this),
      Object.getOwnPropertyDescriptors(this)
    )
    if (this.range) copy.range = [...this.range]
    return copy
  }

  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(
    doc: Document,
    ctx?: ToJSContext
  ): Scalar | YAMLMap | YAMLSeq | undefined {
    let nodes: Node[]
    if (ctx?.aliasResolveCache) {
      nodes = ctx.aliasResolveCache
    } else {
      nodes = []
      visit(doc, {
        Node: (_key: unknown, node: Node) => {
          if (node instanceof Alias || node.anchor) nodes.push(node)
        }
      })
      if (ctx) ctx.aliasResolveCache = nodes
    }

    let found: Scalar | YAMLMap | YAMLSeq | undefined = undefined
    for (const node of nodes) {
      if (node === this) break
      if (node.anchor === this.source) found = node
    }

    return found
  }

  /** A plain JavaScript representation of the resolved value of this alias. */
  toJS(doc: Document<DocValue, boolean>, ctx?: ToJSContext): any {
    if (!doc?.schema) throw new TypeError('A document argument is required')
    ctx ??= new ToJSContext()
    const { anchors, maxAliasCount } = ctx

    const source = this.resolve(doc, ctx)
    if (!source) {
      const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`
      throw new ReferenceError(msg)
    }

    let data = anchors.get(source)
    if (!data) {
      // Resolve anchors for Node.prototype.toJS()
      source.toJS(doc, ctx)
      data = anchors.get(source)
    }
    /* istanbul ignore if */
    if (data?.res === undefined) {
      const msg = 'This should not happen: Alias anchor was not resolved?'
      throw new ReferenceError(msg)
    }
    if (maxAliasCount >= 0) {
      data.count += 1
      data.aliasCount ||= getAliasCount(doc, ctx, source, anchors)
      if (data.count * data.aliasCount > maxAliasCount) {
        const msg =
          'Excessive alias count indicates a resource exhaustion attack'
        throw new ReferenceError(msg)
      }
    }

    return data.res
  }

  toString(
    ctx?: StringifyContext,
    _onComment?: () => void,
    _onChompKeep?: () => void
  ): string {
    const src = `*${this.source}`
    if (ctx) {
      anchorIsValid(this.source)
      if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`
        throw new Error(msg)
      }
      if (ctx.implicitKey) return `${src} `
    }
    return src
  }
}

function getAliasCount(
  doc: Document,
  ctx: ToJSContext,
  node: Node | Pair | null,
  anchors: ToJSContext['anchors']
): number {
  if (node instanceof Alias) {
    const source = node.resolve(doc, ctx)
    const anchor = anchors && source && anchors.get(source)
    return anchor ? anchor.count * anchor.aliasCount : 0
  } else if (node instanceof Pair) {
    const kc = getAliasCount(doc, ctx, node.key, anchors)
    const vc = getAliasCount(doc, ctx, node.value, anchors)
    return Math.max(kc, vc)
  } else if (node && 'items' in node) {
    let count = 0
    for (const item of node.items) {
      const c = getAliasCount(doc, ctx, item, anchors)
      if (c > count) count = c
    }
    return count
  }
  return 1
}
