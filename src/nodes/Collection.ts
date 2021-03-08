import { Type } from '../constants.js'
import { createNode } from '../doc/createNode.js'
import type { Schema } from '../doc/Schema.js'
import { addComment } from '../stringify/addComment.js'
import { stringify, StringifyContext } from '../stringify/stringify.js'
import { isCollection, isNode, isPair, isScalar, NodeBase, NODE_TYPE } from './Node.js'
import type { Pair } from './Pair.js'

export function collectionFromPath(
  schema: Schema,
  path: unknown[],
  value: unknown
) {
  let v = value
  for (let i = path.length - 1; i >= 0; --i) {
    const k = path[i]
    if (typeof k === 'number' && Number.isInteger(k) && k >= 0) {
      const a: unknown[] = []
      a[k] = v
      v = a
    } else {
      const o = {}
      Object.defineProperty(o, typeof k === 'symbol' ? k : String(k), {
        value: v,
        writable: true,
        enumerable: true,
        configurable: true
      })
      v = o
    }
  }
  return createNode(v, undefined, {
    onAlias() {
      throw new Error('Repeated objects are not supported here')
    },
    prevObjects: new Map(),
    schema
  })
}

// null, undefined, or an empty non-string iterable (e.g. [])
export const isEmptyPath = (path: Iterable<unknown> | null | undefined) =>
  path == null ||
  (typeof path === 'object' && !!path[Symbol.iterator]().next().done)

export declare namespace Collection {
  interface StringifyContext {
    blockItem(node: StringifyNode): string
    flowChars: { start: '{' | '['; end: '}' | ']' }
    itemIndent: string
  }

  interface StringifyNode {
    type: 'comment' | 'item'
    str: string
  }
}
export abstract class Collection extends NodeBase {
  static maxFlowStringSingleLineLength = 60

  schema: Schema | undefined;

  declare [NODE_TYPE]: symbol

  declare items: unknown[]

  declare type?:
    | Type.MAP
    | Type.FLOW_MAP
    | Type.SEQ
    | Type.FLOW_SEQ
    | Type.DOCUMENT

  constructor(type: symbol, schema?: Schema) {
    super(type)
    Object.defineProperty(this, 'schema', {
      value: schema,
      configurable: true,
      enumerable: false,
      writable: true
    })
  }

  /** Adds a value to the collection. */
  abstract add(value: unknown): void

  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  abstract delete(key: unknown): boolean

  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  abstract get(key: unknown, keepScalar?: boolean): unknown

  /**
   * Checks if the collection includes a value with the key `key`.
   */
  abstract has(key: unknown): boolean

  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  abstract set(key: unknown, value: unknown): void

  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(path: Iterable<unknown>, value: unknown) {
    if (isEmptyPath(path)) this.add(value)
    else {
      const [key, ...rest] = path
      const node = this.get(key, true)
      if (isCollection(node)) node.addIn(rest, value)
      else if (node === undefined && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value))
      else
        throw new Error(
          `Expected YAML collection at ${key}. Remaining path: ${rest}`
        )
    }
  }

  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn([key, ...rest]: Iterable<unknown>): boolean {
    if (rest.length === 0) return this.delete(key)
    const node = this.get(key, true)
    if (isCollection(node)) return node.deleteIn(rest)
    else
      throw new Error(
        `Expected YAML collection at ${key}. Remaining path: ${rest}`
      )
  }

  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn([key, ...rest]: Iterable<unknown>, keepScalar?: boolean): unknown {
    const node = this.get(key, true)
    if (rest.length === 0)
      return !keepScalar && isScalar(node) ? node.value : node
    else return isCollection(node) ? node.getIn(rest, keepScalar) : undefined
  }

  hasAllNullValues(allowScalar?: boolean) {
    return this.items.every(node => {
      if (!node || isNode(node)) return false
      const n = (node as Pair).value
      return (
        n == null ||
        (allowScalar &&
          isScalar(n) &&
          n.value == null &&
          !n.commentBefore &&
          !n.comment &&
          !n.tag)
      )
    })
  }

  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn([key, ...rest]: Iterable<unknown>): boolean {
    if (rest.length === 0) return this.has(key)
    const node = this.get(key, true)
    return isCollection(node) ? node.hasIn(rest) : false
  }

  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn([key, ...rest]: Iterable<unknown>, value: unknown) {
    if (rest.length === 0) {
      this.set(key, value)
    } else {
      const node = this.get(key, true)
      if (isCollection(node)) node.setIn(rest, value)
      else if (node === undefined && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value))
      else
        throw new Error(
          `Expected YAML collection at ${key}. Remaining path: ${rest}`
        )
    }
  }

  _toString(
    ctx: StringifyContext,
    { blockItem, flowChars, itemIndent }: Collection.StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ) {
    const { indent, indentStep } = ctx
    const inFlow =
      this.type === Type.FLOW_MAP || this.type === Type.FLOW_SEQ || ctx.inFlow
    if (inFlow) itemIndent += indentStep
    ctx = Object.assign({}, ctx, { indent: itemIndent, inFlow, type: null })
    let chompKeep = false
    let hasItemWithNewLine = false
    const nodes = this.items.reduce<Collection.StringifyNode[]>(
      (nodes: Collection.StringifyNode[], item, i) => {
        let comment: string | null = null
        if (isNode(item) || isPair(item)) {
          if (!chompKeep && item.spaceBefore)
            nodes.push({ type: 'comment', str: '' })

          if (item.commentBefore) {
            // This match will always succeed on a non-empty string
            for (const line of item.commentBefore.match(/^.*$/gm) as string[])
              nodes.push({ type: 'comment', str: `#${line}` })
          }

          if (item.comment) comment = item.comment

          const pair = item as any // Apply guards manually in the following
          if (
            inFlow &&
            ((!chompKeep && item.spaceBefore) ||
              item.commentBefore ||
              item.comment ||
              (pair.key && (pair.key.commentBefore || pair.key.comment)) ||
              (pair.value && (pair.value.commentBefore || pair.value.comment)))
          )
            hasItemWithNewLine = true
        }
        chompKeep = false
        let str = stringify(
          item,
          ctx,
          () => (comment = null),
          () => (chompKeep = true)
        )
        if (inFlow && !hasItemWithNewLine && str.includes('\n'))
          hasItemWithNewLine = true
        if (inFlow && i < this.items.length - 1) str += ','
        str = addComment(str, itemIndent, comment)
        if (chompKeep && (comment || inFlow)) chompKeep = false
        nodes.push({ type: 'item', str })
        return nodes
      },
      []
    )
    let str: string
    if (nodes.length === 0) {
      str = flowChars.start + flowChars.end
    } else if (inFlow) {
      const { start, end } = flowChars
      const strings = nodes.map(n => n.str)
      if (
        hasItemWithNewLine ||
        strings.reduce((sum, str) => sum + str.length + 2, 2) >
          Collection.maxFlowStringSingleLineLength
      ) {
        str = start
        for (const s of strings) {
          str += s ? `\n${indentStep}${indent}${s}` : '\n'
        }
        str += `\n${indent}${end}`
      } else {
        str = `${start} ${strings.join(' ')} ${end}`
      }
    } else {
      const strings = nodes.map(blockItem)
      str = strings.shift() || ''
      for (const s of strings) str += s ? `\n${indent}${s}` : '\n'
    }
    if (this.comment) {
      str += '\n' + this.comment.replace(/^/gm, `${indent}#`)
      if (onComment) onComment()
    } else if (chompKeep && onChompKeep) onChompKeep()
    return str
  }
}
