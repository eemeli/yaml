import type { Document } from '../doc/Document.ts'
import type { ToJSOptions } from '../options.ts'
import type { Node } from './types.ts'

/** A context used in `node.toJS()` implementations */
export class ToJSContext {
  anchors: Map<Node, { aliasCount: number; count: number; res: unknown }> =
    new Map()
  /** Cached anchor and alias nodes in the order they occur in the document */
  aliasResolveCache?: Node[]
  mapAsMap: boolean
  mapKeyWarned = false
  maxAliasCount: number

  constructor(opt?: ToJSOptions) {
    this.mapAsMap = opt?.mapAsMap === true
    this.maxAliasCount = opt?.maxAliasCount ?? 100
  }

  setAnchor(node: Node, res: unknown): void {
    const anchor = this.anchors.get(node)
    if (anchor) anchor.res = res
    else this.anchors.set(node, { aliasCount: 0, count: 1, res })
  }

  resolveAlias(
    doc: Document,
    source: Node,
    getAliasCount: () => number
  ): unknown {
    let data = this.anchors.get(source)
    if (!data) {
      source.toJS(doc, this)
      data = this.anchors.get(source)
    }
    /* istanbul ignore if */
    if (data?.res === undefined) {
      const msg = 'This should not happen: Alias anchor was not resolved?'
      throw new ReferenceError(msg)
    }
    if (this.maxAliasCount >= 0) {
      data.count += 1
      data.aliasCount ||= getAliasCount()
      if (data.count * data.aliasCount > this.maxAliasCount) {
        const msg =
          'Excessive alias count indicates a resource exhaustion attack'
        throw new ReferenceError(msg)
      }
    }
    return data.res
  }
}

/** A general-purpose JSON reviver function */
export function toJSON(key: unknown, value: any): any {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  if (typeof value?.toJSON === 'function') value = value.toJSON(key)
  else if (typeof value === 'bigint') value = Number(value)
  return value
}
