// Published as 'yaml/map'

import Collection, { toJSON } from './Collection'
import Pair from './Pair'

export default class YAMLMap extends Collection {
  toJSON() {
    return this.items.reduce((map, { stringKey, value }) => {
      map[stringKey] = toJSON(value)
      return map
    }, {})
  }

  toString({ doc, indent = '', inFlow = false } = {}, onComment) {
    this.items.forEach(item => {
      if (!(item instanceof Pair))
        throw new Error(
          `Map items must all be pairs; found ${JSON.stringify(item)} instead`
        )
    })
    return super.toString(
      {
        blockItem: ({ str }) => str,
        doc,
        flowChars: { start: '{', end: '}' },
        indent,
        inFlow,
        itemIndent: indent + (inFlow ? '  ' : '')
      },
      onComment
    )
  }
}
