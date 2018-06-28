// Published as 'yaml/map'

import toJSON from '../toJSON'
import Collection from './Collection'
import Pair from './Pair'

export default class YAMLMap extends Collection {
  toJSON() {
    return this.items.reduce((map, { stringKey, value }) => {
      map[stringKey] = toJSON(value)
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
