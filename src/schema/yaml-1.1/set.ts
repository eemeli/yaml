import { NodeCreator } from '../../doc/NodeCreator.ts'
import type { NodeOf, Primitive } from '../../nodes/Collection.ts'
import { isMap, isNode, isPair, isScalar } from '../../nodes/identity.ts'
import type { NodeBase } from '../../nodes/Node.ts'
import { Pair } from '../../nodes/Pair.ts'
import type { ToJSContext } from '../../nodes/toJS.ts'
import { findPair, YAMLMap } from '../../nodes/YAMLMap.ts'
import type { CreateNodeOptions } from '../../options.ts'
import type { Schema } from '../../schema/Schema.ts'
import type { StringifyContext } from '../../stringify/stringify.ts'
import type { CollectionTag } from '../types.ts'

export class YAMLSet<
  T extends Primitive | NodeBase = Primitive | NodeBase
> extends YAMLMap<T, T> {
  static tag = 'tag:yaml.org,2002:set'

  constructor(schema?: Schema) {
    super(schema)
    this.tag = YAMLSet.tag
  }

  /**
   * Add a value to the set.
   *
   * If `value` is a Pair, its `.value` must be null and `options` is ignored.
   *
   * If the set already includes a matching value, no value is added.
   */
  add(
    value: unknown,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    if (!isPair(value)) {
      this.set(value, true, options)
    } else if (value.value !== null) {
      throw new TypeError('set pair values must be null')
    } else {
      const prev = findPair(this.items, value.key)
      if (!prev) this.items.push(value as Pair<T, T>)
    }
  }

  /**
   * Returns the value matching `key`.
   */
  get(key: unknown): NodeOf<T> | undefined {
    const pair = findPair(this.items, key)
    return pair?.key
  }

  /**
   * `value` needs to be true/false to add/remove the item from the set.
   */
  set(
    key: unknown,
    value: boolean,
    options?: Omit<CreateNodeOptions, 'aliasDuplicateObjects'>
  ): void {
    if (typeof value !== 'boolean')
      throw new Error(`Expected a boolean value, not ${typeof value}`)
    const prev = findPair(this.items, key)
    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1)
    } else if (!prev && value) {
      let node: NodeBase
      if (isNode(key)) {
        node = key
      } else if (!this.schema) {
        throw new Error('Schema is required')
      } else {
        const nc = new NodeCreator(this.schema, {
          ...options,
          aliasDuplicateObjects: false
        })
        node = nc.create(key)
        nc.setAnchors()
      }
      this.items.push(new Pair(node as NodeOf<T>))
    }
  }

  toJSON(_?: unknown, ctx?: ToJSContext): any {
    return super.toJSON(_, ctx, Set)
  }

  toString(
    ctx?: StringifyContext,
    onComment?: () => void,
    onChompKeep?: () => void
  ): string {
    if (!ctx) return JSON.stringify(this)
    return super.toString({ ...ctx, noValues: true }, onComment, onChompKeep)
  }

  static from(nc: NodeCreator, iterable: unknown): YAMLSet {
    const set = new this(nc.schema)
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable as Iterable<unknown>) {
        if (typeof nc.replacer === 'function')
          value = nc.replacer.call(iterable, value, value)
        set.items.push(nc.createPair(value, null) as Pair<NodeBase, null>)
      }
    return set
  }
}

const hasAllNullValues = (map: YAMLMap): boolean =>
  map.items.every(
    ({ value }) =>
      value == null ||
      (isScalar(value) &&
        value.value == null &&
        !value.commentBefore &&
        !value.comment &&
        !value.tag)
  )

export const set: CollectionTag = {
  collection: 'map',
  identify: value => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: 'tag:yaml.org,2002:set',
  resolve(map, onError) {
    if (!isMap(map)) {
      onError('Expected a mapping for this tag')
      return map
    } else if (!hasAllNullValues(map)) {
      onError('Set items must all have null values')
      return map
    } else {
      const set = Object.assign(new YAMLSet(), map)
      for (const pair of map.items) pair.value &&= null
      return set
    }
  }
}
