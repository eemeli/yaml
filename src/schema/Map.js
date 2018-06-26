// Published as 'yaml/map'

import Collection, { toJSON } from './Collection'

export default class YAMLMap extends Collection {
  toJSON() {
    return this.items.reduce((map, { stringKey, value }) => {
      map[stringKey] = toJSON(value)
      return map
    }, {})
  }

  toString({ doc, indent = '', inFlow = false } = {}, onComment) {
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
