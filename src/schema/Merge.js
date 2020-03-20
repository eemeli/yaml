import { YAMLMap } from './Map'
import { Pair } from './Pair'
import { Scalar } from './Scalar'
import { YAMLSeq } from './Seq'

export const MERGE_KEY = '<<'

export class Merge extends Pair {
  constructor(pair) {
    if (pair instanceof Pair) {
      let seq = pair.value
      if (!(seq instanceof YAMLSeq)) {
        seq = new YAMLSeq()
        seq.items.push(pair.value)
        seq.range = pair.value.range
      }
      super(pair.key, seq)
      this.range = pair.range
    } else {
      super(new Scalar(MERGE_KEY), new YAMLSeq())
    }
    this.type = 'MERGE_PAIR'
  }

  // If the value associated with a merge key is a single mapping node, each of
  // its key/value pairs is inserted into the current mapping, unless the key
  // already exists in it. If the value associated with the merge key is a
  // sequence, then this sequence is expected to contain mapping nodes and each
  // of these nodes is merged in turn according to its order in the sequence.
  // Keys in mapping nodes earlier in the sequence override keys specified in
  // later mapping nodes. -- http://yaml.org/type/merge.html
  addToJSMap(ctx, map) {
    for (const { source } of this.value.items) {
      if (!(source instanceof YAMLMap))
        throw new Error('Merge sources must be maps')
      const srcMap = source.toJSON(null, ctx, Map)
      for (const [key, value] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key)) map.set(key, value)
        } else if (map instanceof Set) {
          map.add(key)
        } else {
          if (!Object.prototype.hasOwnProperty.call(map, key)) map[key] = value
        }
      }
    }
    return map
  }

  toString(ctx, onComment) {
    const seq = this.value
    if (seq.items.length > 1) return super.toString(ctx, onComment)
    this.value = seq.items[0]
    const str = super.toString(ctx, onComment)
    this.value = seq
    return str
  }
}
