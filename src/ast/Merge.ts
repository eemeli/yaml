import { StringifyContext } from '../stringify/stringify.js'
import type { Alias } from './index.js'
import { isMap, isNode, isPair, isSeq } from './Node.js'
import { Pair, PairType } from './Pair.js'
import { Scalar } from './Scalar.js'
import type { ToJSContext } from './toJS.js'
import { YAMLSeq } from './YAMLSeq.js'

export class Merge extends Pair<Scalar, YAMLSeq<Alias>> {
  static KEY = '<<'

  type: PairType.MERGE_PAIR

  declare value: YAMLSeq<Alias>

  constructor(pair?: Pair<Scalar, Alias | YAMLSeq<Alias>>) {
    if (isPair(pair) && isNode(pair.value)) {
      if (isSeq(pair.value)) super(pair.key, pair.value)
      else {
        const seq = new YAMLSeq<Alias>()
        seq.items.push(pair.value)
        seq.range = pair.value.range
        super(pair.key, seq)
      }
      this.range = pair.range
    } else {
      super(new Scalar(Merge.KEY), new YAMLSeq())
    }
    this.type = PairType.MERGE_PAIR
  }

  // If the value associated with a merge key is a single mapping node, each of
  // its key/value pairs is inserted into the current mapping, unless the key
  // already exists in it. If the value associated with the merge key is a
  // sequence, then this sequence is expected to contain mapping nodes and each
  // of these nodes is merged in turn according to its order in the sequence.
  // Keys in mapping nodes earlier in the sequence override keys specified in
  // later mapping nodes. -- http://yaml.org/type/merge.html
  addToJSMap(
    ctx: ToJSContext | undefined,
    map:
      | Map<unknown, unknown>
      | Set<unknown>
      | Record<string | number | symbol, unknown>
  ) {
    for (const { source } of this.value.items) {
      if (!isMap(source)) throw new Error('Merge sources must be maps')
      const srcMap = source.toJSON(null, ctx, Map)
      for (const [key, value] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key)) map.set(key, value)
        } else if (map instanceof Set) {
          map.add(key)
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true
          })
        }
      }
    }
    return map
  }

  toString(ctx?: StringifyContext, onComment?: () => void) {
    const seq = this.value
    if (seq.items.length > 1) return super.toString(ctx, onComment)
    try {
      this.value = seq.items[0] as any
      return super.toString(ctx, onComment)
    } finally {
      this.value = seq
    }
  }
}
