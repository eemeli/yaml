import Map from './schema/Map'
import Pair from './schema/Pair'
import Scalar from './schema/Scalar'
import Seq from './schema/Seq'

export default function resolveValue (doc, value) {
  if (value == null) return new Scalar(null)
  if (typeof value !== 'object') return new Scalar(value)
  if (Array.isArray(value)) {
    const seq = new Seq(doc)
    seq.items = value.map(v => resolveValue(doc, v))
    return seq
  } else {
    const map = new Map(doc)
    map.items = Object.keys(value).map(key => {
      const k = resolveValue(doc, key)
      const v = resolveValue(doc, value[key])
      return new Pair(k, v)
    })
    return map
  }
}

