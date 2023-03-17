import { anchorIsValid } from '../doc/anchors.js'
import type { Document } from '../doc/Document.js'
import type { FlowScalar } from '../parse/cst.js'
import type { StringifyContext } from '../stringify/stringify.js'
import { visit } from '../visit.js'
import {
  ALIAS,
  isAlias,
  isCollection,
  isPair,
  isScalar,
  Node,
  NodeBase,
  Range
} from './Node.js'
import type { Scalar } from './Scalar'
import type { ToJSContext } from './toJS.js'
import type { YAMLMap } from './YAMLMap.js'
import type { YAMLSeq } from './YAMLSeq.js'

export declare namespace Alias {
  interface Parsed extends Alias {
    range: Range
    srcToken?: FlowScalar & { type: 'alias' }
  }
}

const RESOLVE = Symbol('_resolve')

export class Alias extends NodeBase {
  source: string

  declare anchor?: never

  constructor(source: string) {
    super(ALIAS)
    this.source = source
    Object.defineProperty(this, 'tag', {
      set() {
        throw new Error('Alias nodes cannot have tags')
      }
    })
  }

  [RESOLVE](doc: Document) {
    let found: Scalar | YAMLMap | YAMLSeq | undefined = undefined
    // @ts-expect-error - TS doesn't notice the assignment in the visitor
    let root: Node & { anchor: string } = undefined
    const pathLike = this.source.includes('/')
    visit(doc, {
      Node: (_key: unknown, node: Node) => {
        if (node === this) return visit.BREAK
        const { anchor } = node
        if (anchor === this.source) {
          found = node
        } else if (
          doc.directives?.yaml.version === 'next' &&
          anchor &&
          pathLike &&
          this.source.startsWith(anchor + '/') &&
          (!root || root.anchor.length <= anchor.length)
        ) {
          root = node as Node & { anchor: string }
        }
      }
    })
    if (found) return { node: found, root: found }

    if (isCollection(root)) {
      const parts = this.source.substring(root.anchor.length + 1).split('/')
      const node = root.getIn(parts, true)
      if (isCollection(node) || isScalar(node)) return { node, root }
    }

    return { node: undefined, root }
  }

  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(doc: Document): Scalar | YAMLMap | YAMLSeq | undefined {
    return this[RESOLVE](doc).node
  }

  toJSON(_arg?: unknown, ctx?: ToJSContext) {
    if (!ctx) return { source: this.source }
    const { anchors, doc, maxAliasCount, resolved } = ctx
    const { node, root } = this[RESOLVE](doc)
    if (!node) {
      const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`
      throw new ReferenceError(msg)
    }

    if (maxAliasCount >= 0) {
      const data = anchors.get(root)
      if (!data) {
        const msg = 'This should not happen: Alias anchor was not resolved?'
        throw new ReferenceError(msg)
      }
      data.count += 1
      data.aliasCount ||= getAliasCount(doc, root, anchors)
      if (data.count * data.aliasCount > maxAliasCount) {
        const msg =
          'Excessive alias count indicates a resource exhaustion attack'
        throw new ReferenceError(msg)
      }
    }

    return resolved.get(node)
  }

  toString(
    ctx?: StringifyContext,
    _onComment?: () => void,
    _onChompKeep?: () => void
  ) {
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
  node: unknown,
  anchors: ToJSContext['anchors']
): number {
  if (isAlias(node)) {
    const { root } = node[RESOLVE](doc)
    const anchor = root && anchors?.get(root)
    return anchor ? anchor.count * anchor.aliasCount : 0
  } else if (isCollection(node)) {
    let count = 0
    for (const item of node.items) {
      const c = getAliasCount(doc, item, anchors)
      if (c > count) count = c
    }
    return count
  } else if (isPair(node)) {
    const kc = getAliasCount(doc, node.key, anchors)
    const vc = getAliasCount(doc, node.value, anchors)
    return Math.max(kc, vc)
  }
  return 1
}
