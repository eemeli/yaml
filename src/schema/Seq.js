// Published as 'yaml/seq'

import toJSON from '../toJSON'
import Collection from './Collection'

export default class YAMLSeq extends Collection {
  toJSON(_, opt) {
    return this.items.map((v, i) => toJSON(v, String(i), opt))
  }

  toString(ctx, onComment, onChompKeep) {
    if (!ctx) return JSON.stringify(this)
    return super.toString(
      ctx,
      {
        blockItem: n => (n.type === 'comment' ? n.str : `- ${n.str}`),
        flowChars: { start: '[', end: ']' },
        isMap: false,
        itemIndent: (ctx.indent || '') + '  '
      },
      onComment,
      onChompKeep
    )
  }
}
