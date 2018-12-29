import YAMLMap from './schema/Map'
import Pair from './schema/Pair'
import Scalar from './schema/Scalar'
import Seq from './schema/Seq'

function createMapNode(iterable, wrapScalars) {
  const map = new YAMLMap()
  for (const it of iterable) {
    if (!Array.isArray(it) || it.length !== 2)
      throw new TypeError(`Expected [key, value] tuple: ${it}`)
    const k = createNode(it[0], wrapScalars)
    const v = createNode(it[1], wrapScalars)
    map.items.push(new Pair(k, v))
  }
  return map
}

export default function createNode(value, wrapScalars = true) {
  if (value == null) return new Scalar(null)
  if (typeof value.toJSON === 'function') value = value.toJSON()
  if (typeof value !== 'object') return wrapScalars ? new Scalar(value) : value
  if (Array.isArray(value)) {
    const seq = new Seq()
    seq.items = value.map(v => createNode(v, wrapScalars))
    return seq
  } else if (typeof Symbol !== 'undefined' && value[Symbol.iterator]) {
    if (value instanceof Map) return createMapNode(value, wrapScalars)
    const seq = new Seq()
    for (const it of value) {
      const v = createNode(it, wrapScalars)
      seq.items.push(v)
    }
    return seq
  } else {
    const map = new YAMLMap()
    map.items = Object.keys(value).map(key => {
      const k = createNode(key, wrapScalars)
      const v = createNode(value[key], wrapScalars)
      return new Pair(k, v)
    })
    return map
  }
}
