import { YAMLSemanticError } from '../../errors'
import toJSON from '../../toJSON'
import YAMLMap, { findPair } from '../../schema/Map'
import Merge from '../../schema/Merge'
import Pair from '../../schema/Pair'
import parseMap from '../../schema/parseMap'
import Scalar from '../../schema/Scalar'

export class YAMLSet extends YAMLMap {
  static tag = 'tag:yaml.org,2002:set'

  constructor() {
    super()
    this.tag = YAMLSet.tag
  }

  add(key) {
    const pair = key instanceof Pair ? key : new Pair(key)
    const prev = findPair(this.items, pair.key)
    if (!prev) this.items.push(pair)
  }

  get(key, keepPair) {
    const pair = findPair(this.items, key)
    return !keepPair && pair instanceof Pair
      ? pair.key instanceof Scalar
        ? pair.key.value
        : pair.key
      : pair
  }

  set(key, value) {
    if (typeof value !== 'boolean')
      throw new Error(
        `Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`
      )
    const prev = findPair(this.items, key)
    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1)
    } else if (!prev && value) {
      this.items.push(new Pair(key))
    }
  }

  toJSON(_, ctx) {
    return super.toJSON(_, ctx, Set)
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx) return JSON.stringify(this)
    if (this.hasAllNullValues())
      return super.toString(ctx, onComment, onChompKeep)
    else throw new Error('Set items must all have null values')
  }
}

function parseSet(doc, cst) {
  const map = parseMap(doc, cst)
  if (!map.hasAllNullValues())
    throw new YAMLSemanticError(cst, 'Set items must all have null values')
  return Object.assign(new YAMLSet(), map)
}

function createSet(schema, iterable, ctx) {
  const set = new YAMLSet()
  for (const value of iterable)
    set.items.push(schema.createPair(value, null, ctx))
  return set
}

export default {
  identify: value => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: 'tag:yaml.org,2002:set',
  resolve: parseSet,
  createNode: createSet
}
