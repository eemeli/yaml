import Alias from './schema/Alias'
import Map from './schema/Map'
import Scalar from './schema/Scalar'
import Seq from './schema/Seq'

export default class Anchors {
  static validAnchorNode(node) {
    return node instanceof Scalar || node instanceof Seq || node instanceof Map
  }

  map = {}

  createAlias(node, name) {
    this.setAnchor(node, name)
    return new Alias(node)
  }

  getName(node) {
    const { map } = this
    return Object.keys(map).find(a => map[a] === node)
  }

  getNode(name) {
    return this.map[name]
  }

  newName(prefix) {
    const names = Object.keys(this.map)
    for (let i = 1; true; ++i) {
      const name = `${prefix}${i}`
      if (!names.includes(name)) return name
    }
  }

  // During parsing, map & aliases contain CST nodes
  resolveNodes() {
    const { map, _cstAliases } = this
    Object.keys(map).forEach(a => {
      map[a] = map[a].resolved
    })
    _cstAliases.forEach(a => {
      a.source = a.source.resolved
    })
    delete this._cstAliases
  }

  setAnchor(node, name) {
    if (node != null && !Anchors.validAnchorNode(node)) {
      throw new Error('Anchors may only be set for Scalar, Seq and Map nodes')
    }
    if (name && /[\x00-\x19\s,[\]{}]/.test(name)) {
      throw new Error(
        'Anchor names must not contain whitespace or control characters'
      )
    }
    const { map } = this
    const prev = node && Object.keys(map).find(a => map[a] === node)
    if (prev) {
      if (!name) {
        return prev
      } else if (prev !== name) {
        delete map[prev]
        map[name] = node
      }
    } else {
      if (!name) {
        if (!node) return null
        name = this.newName('a')
      }
      map[name] = node
    }
    return name
  }
}
