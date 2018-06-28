// Published as 'yaml/seq'

import toJSON from '../toJSON'
import Collection from './Collection'

export default class YAMLSeq extends Collection {
  toJSON() {
    return this.items.map(toJSON)
  }

  toString({ doc, indent = '', inFlow = false } = {}, onComment) {
    return super.toString(
      {
        blockItem: ({ type, str }) => (type === 'comment' ? str : `- ${str}`),
        doc,
        flowChars: { start: '[', end: ']' },
        indent,
        inFlow,
        itemIndent: indent + (inFlow ? '    ' : '  ')
      },
      onComment
    )
  }
}
