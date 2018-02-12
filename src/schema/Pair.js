import Collection, { toJSON } from './Collection'

export default class Pair {
  constructor (key, value = null) {
    this.key = key
    this.value = value
  }

  get stringKey () {
    const key = toJSON(this.key)
    if (key === null) return ''
    if (typeof key === 'object') try { return JSON.stringify(key) }
    catch (e) { /* should not happen, but let's ignore in any case */ }
    return String(key)
  }

  toJSON () {
    const pair = {}
    pair[this.stringKey] = toJSON(this.value)
    return pair
  }

  toString (tags, options) {
    const { key, value } = this
    const { indent } = options
    const opt = Object.assign({}, options, { implicitKey: true })
    const stringifyKey = tags ? tags.getStringifier(key) : Tags.defaultStringifier
    const keyStr = stringifyKey(key, opt)
    opt.implicitKey = false
    opt.indent += '  '
    const stringifyValue = tags ? tags.getStringifier(value) : Tags.defaultStringifier
    const valueStr = stringifyValue(value, opt)
    if (key instanceof Collection) {
      return `? ${keyStr}\n${indent}: ${valueStr}`
    } else if (value instanceof Collection) {
      return `${keyStr}:\n${opt.indent}${valueStr}`
    } else {
      return `${keyStr}: ${valueStr}`
    }
  }
}

