// Published as 'yaml/map'

import toJSON from '../toJSON'
import Collection from './Collection'
import Merge from './Merge'
import Pair from './Pair'

export default class YAMLMap extends Collection {
  toJSON(_, opt) {
    if (opt && opt.mapAsMap) return this.toJSMap(opt)
    return this.items.reduce((map, item) => {
      if (item instanceof Merge) {
        // If the value associated with a merge key is a single mapping node,
        // each of its key/value pairs is inserted into the current mapping,
        // unless the key already exists in it. If the value associated with the
        // merge key is a sequence, then this sequence is expected to contain
        // mapping nodes and each of these nodes is merged in turn according to
        // its order in the sequence. Keys in mapping nodes earlier in the
        // sequence override keys specified in later mapping nodes.
        // -- http://yaml.org/type/merge.html
        const keys = Object.keys(map)
        const { items } = item.value
        for (let i = items.length - 1; i >= 0; --i) {
          const { source } = items[i]
          if (source instanceof YAMLMap) {
            const obj = source.toJSON('', opt)
            Object.keys(obj).forEach(key => {
              if (!keys.includes(key)) map[key] = obj[key]
            })
          } else {
            throw new Error('Merge sources must be maps')
          }
        }
      } else {
        const { stringKey, value } = item
        map[stringKey] = toJSON(value, stringKey, opt)
      }
      return map
    }, {})
  }

  toJSMap(opt) {
    const map = new Map()
    for (const item of this.items) {
      if (item instanceof Merge) {
        const { items } = item.value
        for (let i = items.length - 1; i >= 0; --i) {
          const { source } = items[i]
          if (source instanceof YAMLMap) {
            for (const [key, value] of source.toJSMap(opt)) {
              if (!map.has(key)) map.set(key, value)
            }
          } else {
            throw new Error('Merge sources must be maps')
          }
        }
      } else {
        const key = toJSON(item.key, '', opt)
        const value = toJSON(item.value, key, opt)
        map.set(key, value)
      }
    }
    return map
  }

  toString(ctx, onComment) {
    if (!ctx) return JSON.stringify(this)
    this.items.forEach(item => {
      if (!(item instanceof Pair))
        throw new Error(
          `Map items must all be pairs; found ${JSON.stringify(item)} instead`
        )
    })
    return super.toString(
      ctx,
      {
        blockItem: n => n.str,
        flowChars: { start: '{', end: '}' },
        itemIndent: ctx.indent || ''
      },
      onComment
    )
  }
}
