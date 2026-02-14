import type { ToJSOptions } from '../options.ts'
import type { Node } from './Node.ts'

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
    this.anchors.set(node, { aliasCount: 0, count: 1, res })
  }
}

/** A general-purpose JSON reviver function */
export function toJSON(key: unknown, value: any): any {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  if (typeof value?.toJSON === 'function') value = value.toJSON(key)
  else if (typeof value === 'bigint') value = Number(value)
  return value
}
