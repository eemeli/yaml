// Published as 'yaml/map'

import toJSON from '../toJSON'
import Collection from './Collection'
import Merge from './Merge'
import Pair from './Pair'

export default class YAMLMap extends Collection {
  toJSON() {
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
            const obj = source.toJSON()
            Object.keys(obj).forEach(key => {
              if (!keys.includes(key)) map[key] = obj[key]
            })
          } else {
            throw new Error('Merge sources must be maps')
          }
        }
      } else {
        const { stringKey, value } = item
        map[stringKey] = toJSON(value)
      }
      return map
    }, {})
  }

  toString(ctx, onComment) {
    if (!ctx) return JSON.stringify(this)
    this.items.forEach(item => {
      if (!(item instanceof Pair))
        throw new Error(
          `Map items must all be pairs; found ${JSON.stringify(item)} instead`
        )
    })
    let itemIndent = ctx.indent || ''
    if (ctx.inFlow) itemIndent += '  '
    return super.toString(
      ctx,
      {
        blockItem: ({ str }) => str,
        flowChars: { start: '{', end: '}' },
        itemIndent
      },
      onComment
    )
  }
}
