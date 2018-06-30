import Pair from './Pair'
import Scalar from './Scalar'
import Seq from './Seq'

export const MERGE_KEY = '<<'

export default class Merge extends Pair {
  constructor(pair) {
    if (pair instanceof Pair) {
      let seq = pair.value
      if (!(seq instanceof Seq)) {
        seq = new Seq()
        seq.items.push(pair.value)
        seq.range = pair.value.range
      }
      super(pair.key, seq)
      this.range = pair.range
    } else {
      super(new Scalar(MERGE_KEY), new Seq())
    }
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
